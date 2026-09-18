#!/bin/bash
set -euo pipefail

GAME="${GAME:?ERROR: GAME env var required}"
HARNESS="${HARNESS:-claude}"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-opus-4-8}"
OPENAI_MODEL="${OPENAI_MODEL:-gpt-5.5}"
CODEX_REASONING_EFFORT="${CODEX_REASONING_EFFORT:-}"
MAX_TURNS="${MAX_TURNS:-120}"
MAX_RETRIES="${MAX_RETRIES:-1}"
RETRY_DELAY="${RETRY_DELAY:-15}"
WALL_CAP_SECS="${WALL_CAP_SECS:-4800}"
MAX_ATTEMPTS="$MAX_RETRIES"
WATCHDOG_INTERVAL_SECS="${WATCHDOG_INTERVAL_SECS:-10}"
STALE_CAP_SECS="${STALE_CAP_SECS:-600}"

if [[ "$HARNESS" == "claude" ]]; then
  export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
  export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://api.anthropic.com}"
  if [[ -z "$ANTHROPIC_API_KEY" ]]; then
    echo "ERROR: ANTHROPIC_API_KEY required for claude harness" >&2
    exit 2
  fi
elif [[ "$HARNESS" == "codex" ]]; then
  export OPENAI_API_KEY="${OPENAI_API_KEY:-}"
  export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://api.openai.com/v1}"
  if [[ -z "$OPENAI_API_KEY" ]]; then
    echo "ERROR: OPENAI_API_KEY required for codex harness" >&2
    exit 2
  fi
else
  echo "ERROR: unknown HARNESS: $HARNESS (expected: claude|codex)" >&2; exit 2
fi

ENVARENA_DIR="${ENVARENA_DIR:-/envarena}"
CODEX_DEEPSEEK_MODELS_FILE="${CODEX_DEEPSEEK_MODELS_FILE:-$ENVARENA_DIR/config/deepseek-models.json}"
WORKSPACE_DIR="$ENVARENA_DIR/workspace"
SCRIPTS_DIR="$ENVARENA_DIR/scripts"
OUTPUT_DIR="$WORKSPACE_DIR"

is_deepseek_codex_model() {
  case "$OPENAI_MODEL" in
    deepseek-v4-flash|deepseek-v4-pro|deepseek-v4-flash-vision-exp) return 0 ;;
    *) return 1 ;;
  esac
}

if [[ "$HARNESS" == "codex" ]] && is_deepseek_codex_model; then
  CODEX_REASONING_EFFORT="${CODEX_REASONING_EFFORT:-max}"
  [[ "$CODEX_REASONING_EFFORT" =~ ^(low|high|max)$ ]] || {
    echo "ERROR: CODEX_REASONING_EFFORT must be low, high, or max" >&2
    exit 2
  }
  [[ -f "$CODEX_DEEPSEEK_MODELS_FILE" ]] || {
    echo "ERROR: DeepSeek Codex model catalog not found: $CODEX_DEEPSEEK_MODELS_FILE" >&2
    exit 2
  }
fi

GAME_TASK_DIR="$WORKSPACE_DIR"

mkdir -p "$OUTPUT_DIR"

[[ -d "$GAME_TASK_DIR" ]] || { echo "ERROR: workspace dir not found: $GAME_TASK_DIR" >&2; exit 2; }

QUERY_FILE="$GAME_TASK_DIR/target.md"
GDD_FILE="$GAME_TASK_DIR/game-spec.md"
TDD_FILE="$GAME_TASK_DIR/tdd.md"
GENERATION_ATTEMPTS_PY="$SCRIPTS_DIR/generation_attempts.py"

[[ -f "$QUERY_FILE" ]] || { echo "ERROR: target.md not found: $QUERY_FILE" >&2; exit 2; }
[[ -f "$GDD_FILE" ]] || { echo "ERROR: game-spec.md not found: $GDD_FILE" >&2; exit 2; }
[[ -f "$TDD_FILE" ]] || { echo "ERROR: tdd.md not found: $TDD_FILE" >&2; exit 2; }
[[ -f "$GENERATION_ATTEMPTS_PY" ]] || { echo "ERROR: generation helper not found: $GENERATION_ATTEMPTS_PY" >&2; exit 2; }

SETTINGS_FILE="/tmp/settings.json"
cat > "$SETTINGS_FILE" <<'EOF'
{
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Bash"]
  }
}
EOF

mkdir -p /tmp/node_modules
GLOBAL_NODE_MODULES="$(npm root -g 2>/dev/null || true)"
export NODE_PATH="/tmp/node_modules${GLOBAL_NODE_MODULES:+:$GLOBAL_NODE_MODULES}"
if ! node -e "require('ws')" >/dev/null 2>&1; then
  cd /tmp && npm install ws --silent 2>/dev/null || true
fi
cd "$WORKSPACE_DIR"

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }
log() { echo "$(timestamp) | $1"; }

log_optional_claude_envs() {
  local name value
  local names=(
    ANTHROPIC_DEFAULT_HAIKU_MODEL
    ANTHROPIC_DEFAULT_OPUS_MODEL
    ANTHROPIC_DEFAULT_SONNET_MODEL
    API_TIMEOUT_MS
    CLAUDE_CODE_ATTRIBUTION_HEADER
    CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING
    CLAUDE_CODE_EFFORT_LEVEL
    CLAUDE_CODE_MAX_RETRIES
  )
  for name in "${names[@]}"; do
    if value=$(printenv "$name"); then
      log "$name: $value"
    fi
  done
}

claude_trace_has_auth_failure() {
  local log_file
  local auth_pattern='"api_error_status"[[:space:]]*:[[:space:]]*(401|403)|'
  auth_pattern+='"type"[[:space:]]*:[[:space:]]*"error"[^[:cntrl:]]*(401|403|Unauthorized|Forbidden|AuthRequired)|'
  auth_pattern+='"error"[[:space:]]*:[[:space:]]*\{[^}]*"type"[[:space:]]*:[[:space:]]*"(authentication_error|invalid_api_key|permission_error)"|'
  auth_pattern+='"error"[[:space:]]*:[[:space:]]*"(authentication_error|invalid_api_key|permission_error)"|'
  auth_pattern+='Request rejected[^[:cntrl:]]*(401|403)|'
  auth_pattern+='API Error:[^[:cntrl:]]*(401|403|Unauthorized|Forbidden)|'
  auth_pattern+='AuthRequired|invalid LLM model API key'
  for log_file in "$@"; do
    [[ -s "$log_file" ]] || continue
    if grep -Eiq "$auth_pattern" "$log_file"; then
      return 0
    fi
  done
  return 1
}

QUERY=$(cat "$QUERY_FILE")

log "Game: $GAME"
log "Harness: $HARNESS"
log "Output: $OUTPUT_DIR/"
log "Task file: $QUERY_FILE"
if [[ "$HARNESS" == "claude" ]]; then
  log "Model: $ANTHROPIC_MODEL"
  log "ANTHROPIC_API_KEY: configured"
  log "ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
  log "Authentication: x-api-key first; fall back to Bearer only on 401/403 authentication failures"
  log_optional_claude_envs
else
  log "Model: $OPENAI_MODEL"
  log "OPENAI_API_KEY: configured"
  log "OPENAI_BASE_URL: $OPENAI_BASE_URL"
  if is_deepseek_codex_model; then
    log "Codex model catalog: $CODEX_DEEPSEEK_MODELS_FILE"
    log "Codex reasoning effort: $CODEX_REASONING_EFFORT"
  fi
fi

PROMPT="$QUERY"

log "Phase 1: Generating game code..."

START_TIME=$(date +%s)
ATTEMPT=0
SUCCESSFUL_ATTEMPT=0
GEN_FAIL_REASON="no_index_html"
CLAUDE_AUTH_MODE="x-api-key"
GENERATION_ATTEMPTS_DIR="$OUTPUT_DIR/generation-attempts"
GENERATION_SUMMARY_FILE="$OUTPUT_DIR/generation.json"
ATTEMPT_LOG_ROOT=$(mktemp -d "/tmp/gamebench-generation-attempts.XXXXXX")
TASK_INPUT_ROOT=$(mktemp -d "/tmp/gamebench-task-inputs.XXXXXX")
TASK_INPUT_NAMES=(target.md game-spec.md tdd.md)
for task_input in "${TASK_INPUT_NAMES[@]}"; do
  cp "$OUTPUT_DIR/$task_input" "$TASK_INPUT_ROOT/$task_input"
done

cleanup_attempt_logs() {
  rm -rf -- "$ATTEMPT_LOG_ROOT" "$TASK_INPUT_ROOT"
}
trap cleanup_attempt_logs EXIT

index_html_is_complete() {
  [[ -f "$OUTPUT_DIR/index.html" && ! -L "$OUTPUT_DIR/index.html" && -s "$OUTPUT_DIR/index.html" ]] \
    && grep -Eiq '</html[[:space:]]*>' "$OUTPUT_DIR/index.html"
}

restore_task_inputs() {
  local task_input
  for task_input in "${TASK_INPUT_NAMES[@]}"; do
    rm -rf -- "$OUTPUT_DIR/$task_input"
    cp "$TASK_INPUT_ROOT/$task_input" "$OUTPUT_DIR/$task_input"
    chmod 0444 "$OUTPUT_DIR/$task_input"
  done
}

reset_generation_workspace() {
  local entry
  while IFS= read -r -d '' entry; do
    rm -rf -- "$entry"
  done < <(find "$OUTPUT_DIR" -mindepth 1 -maxdepth 1 -print0)
  restore_task_inputs
}

run_harness_session() {
  local auth_mode="${1:-x-api-key}"

  ATTEMPT_FAIL_REASON=""
  case "$HARNESS" in
    claude)
      if [[ "$auth_mode" == "bearer" ]]; then
        log "  Claude authentication: Bearer"
        env -u ANTHROPIC_API_KEY \
          ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY" \
          claude -p "$PROMPT" \
          --model "$ANTHROPIC_MODEL" \
          --settings "$SETTINGS_FILE" \
          --dangerously-skip-permissions \
          --add-dir "$OUTPUT_DIR" \
          --max-turns "$MAX_TURNS" \
          --output-format stream-json \
          --verbose \
          > "$TRACE_FILE" 2>"$ATTEMPT_STDERR" &
      else
        log "  Claude authentication: x-api-key"
        env -u ANTHROPIC_AUTH_TOKEN \
          claude -p "$PROMPT" \
          --model "$ANTHROPIC_MODEL" \
          --settings "$SETTINGS_FILE" \
          --dangerously-skip-permissions \
          --add-dir "$OUTPUT_DIR" \
          --max-turns "$MAX_TURNS" \
          --output-format stream-json \
          --verbose \
          > "$TRACE_FILE" 2>"$ATTEMPT_STDERR" &
      fi
      ;;
    codex)
      CODEX_PROVIDER_ARGS=(
        -c 'model_provider="company"'
        -c 'model_providers.company.name="Company API"'
        -c "model_providers.company.base_url=\"$OPENAI_BASE_URL\""
        -c 'model_providers.company.env_key="OPENAI_API_KEY"'
        -c 'model_providers.company.wire_api="responses"'
      )
      if is_deepseek_codex_model; then
        CODEX_PROVIDER_ARGS=(
          -c 'model_provider="deepseek"'
          -c 'model_providers.deepseek.name="DeepSeek"'
          -c "model_providers.deepseek.base_url=\"$OPENAI_BASE_URL\""
          -c 'model_providers.deepseek.env_key="OPENAI_API_KEY"'
          -c 'model_providers.deepseek.wire_api="responses"'
          -c "model_catalog_json=\"$CODEX_DEEPSEEK_MODELS_FILE\""
          -c "model_reasoning_effort=\"$CODEX_REASONING_EFFORT\""
        )
      fi
      codex exec \
        --model "$OPENAI_MODEL" \
        "${CODEX_PROVIDER_ARGS[@]}" \
        --cd "$OUTPUT_DIR" \
        --skip-git-repo-check \
        --dangerously-bypass-approvals-and-sandbox \
        --ephemeral \
        --json \
        --output-last-message "$FINAL_MESSAGE" \
        "$PROMPT" \
        > "$TRACE_FILE" 2>"$ATTEMPT_STDERR" &
      ;;
  esac
  HARNESS_PID=$!

  WD_START="$ATTEMPT_START"
  WD_LAST=0
  WD_STALE=0
  WD_INTERVAL="$WATCHDOG_INTERVAL_SECS"

  while kill -0 "$HARNESS_PID" 2>/dev/null; do
    sleep "$WD_INTERVAL"
    kill -0 "$HARNESS_PID" 2>/dev/null || break

    WD_ELAPSED=$(( $(date +%s) - WD_START ))
    if [[ $WD_ELAPSED -ge $WALL_CAP_SECS ]]; then
      log "  watchdog: Wall-clock timeout after ${WD_ELAPSED}s, killing"
      ATTEMPT_FAIL_REASON="wall_timeout"
      kill "$HARNESS_PID" 2>/dev/null || true
      sleep 2
      kill -9 "$HARNESS_PID" 2>/dev/null || true
      break
    fi

    WD_CUR=$(wc -c < "$TRACE_FILE" 2>/dev/null | tr -d ' ')
    WD_CUR="${WD_CUR:-0}"
    if [[ "$WD_CUR" -eq "$WD_LAST" ]]; then
      ((WD_STALE += WD_INTERVAL))
      if [[ $WD_STALE -ge $STALE_CAP_SECS ]]; then
        log "  watchdog: No output for ${WD_STALE}s, killing"
        ATTEMPT_FAIL_REASON="stale_timeout"
        kill "$HARNESS_PID" 2>/dev/null || true
        sleep 2
        kill -9 "$HARNESS_PID" 2>/dev/null || true
        break
      fi
    else
      WD_STALE=0
      WD_LAST=$WD_CUR
    fi
  done

  set +e
  wait "$HARNESS_PID" 2>/dev/null
  HARNESS_EXIT=$?
  set -e
}

publish_generation_attempts() {
  rm -rf -- "$GENERATION_ATTEMPTS_DIR"
  cp -R "$ATTEMPT_LOG_ROOT" "$GENERATION_ATTEMPTS_DIR"
  python3 "$GENERATION_ATTEMPTS_PY" summarize \
    --attempts-dir "$GENERATION_ATTEMPTS_DIR" \
    --harness "$HARNESS" \
    --max-attempts "$MAX_ATTEMPTS" \
    --output "$GENERATION_SUMMARY_FILE"
}

if index_html_is_complete; then
  log "  Complete index.html already exists; skipping generation"
else
while [[ $ATTEMPT -lt $MAX_ATTEMPTS ]]; do
  ((ATTEMPT++)) || true

  if [[ $ATTEMPT -gt 1 ]]; then
    log "  Retrying from scratch #$ATTEMPT/$MAX_ATTEMPTS (waiting ${RETRY_DELAY}s)..."
    sleep "$RETRY_DELAY"
  fi

  reset_generation_workspace

  ATTEMPT_DIR="$ATTEMPT_LOG_ROOT/attempt-$ATTEMPT"
  TRACE_FILE="$ATTEMPT_DIR/trace.jsonl"
  ATTEMPT_STDERR="$ATTEMPT_DIR/${HARNESS}-stderr.log"
  FINAL_MESSAGE="$ATTEMPT_DIR/final-message.txt"
  mkdir -p "$ATTEMPT_DIR"
  : > "$TRACE_FILE"
  : > "$ATTEMPT_STDERR"
  ATTEMPT_START=$(date +%s)
  ATTEMPT_FAIL_REASON=""

  if [[ "$HARNESS" == "claude" ]]; then
    ATTEMPT_AUTH_MODE="$CLAUDE_AUTH_MODE"
  else
    ATTEMPT_AUTH_MODE="not-applicable"
  fi
  ATTEMPT_AUTH_FALLBACK_USED=false
  run_harness_session "$ATTEMPT_AUTH_MODE"

  if [[ "$HARNESS" == "claude" && "$ATTEMPT_AUTH_MODE" == "x-api-key" ]] \
    && claude_trace_has_auth_failure "$TRACE_FILE" "$ATTEMPT_STDERR"; then
    log "  x-api-key authentication failed (401/403); retrying with Bearer within the same attempt"
    mv -- "$TRACE_FILE" "$ATTEMPT_DIR/trace-api-key.jsonl"
    mv -- "$ATTEMPT_STDERR" "$ATTEMPT_DIR/claude-stderr-api-key.log"
    reset_generation_workspace
    : > "$TRACE_FILE"
    : > "$ATTEMPT_STDERR"
    CLAUDE_AUTH_MODE="bearer"
    ATTEMPT_AUTH_MODE="bearer"
    ATTEMPT_AUTH_FALLBACK_USED=true
    run_harness_session "$ATTEMPT_AUTH_MODE"
  fi

  ATTEMPT_END=$(date +%s)
  ATTEMPT_ELAPSED=$(( ATTEMPT_END - ATTEMPT_START ))
  ARTIFACT_EXISTS=false
  ARTIFACT_COMPLETE=false
  ARTIFACT_SIZE=0
  if [[ -e "$OUTPUT_DIR/index.html" || -L "$OUTPUT_DIR/index.html" ]]; then
    ARTIFACT_EXISTS=true
  fi
  if [[ -f "$OUTPUT_DIR/index.html" && ! -L "$OUTPUT_DIR/index.html" ]]; then
    ARTIFACT_SIZE=$(wc -c < "$OUTPUT_DIR/index.html" | tr -d ' ')
  fi
  if index_html_is_complete; then
    ARTIFACT_COMPLETE=true
  fi

  ATTEMPT_STATUS="failed"
  if [[ -n "$ATTEMPT_FAIL_REASON" ]]; then
    :
  elif [[ $HARNESS_EXIT -ne 0 ]]; then
    ATTEMPT_FAIL_REASON="harness_exit_$HARNESS_EXIT"
  elif [[ "$ARTIFACT_EXISTS" != true ]]; then
    ATTEMPT_FAIL_REASON="no_index_html"
  elif [[ -L "$OUTPUT_DIR/index.html" || ! -f "$OUTPUT_DIR/index.html" || ! -s "$OUTPUT_DIR/index.html" ]]; then
    ATTEMPT_FAIL_REASON="invalid_index_html"
  elif [[ "$ARTIFACT_COMPLETE" != true ]]; then
    ATTEMPT_FAIL_REASON="incomplete_index_html"
  else
    ATTEMPT_STATUS="success"
    ATTEMPT_FAIL_REASON=""
  fi

  python3 "$GENERATION_ATTEMPTS_PY" record \
    --output "$ATTEMPT_DIR/attempt.json" \
    --attempt "$ATTEMPT" \
    --status "$ATTEMPT_STATUS" \
    --failure-reason "$ATTEMPT_FAIL_REASON" \
    --auth-mode "$ATTEMPT_AUTH_MODE" \
    --auth-fallback-used "$ATTEMPT_AUTH_FALLBACK_USED" \
    --harness-exit-code "$HARNESS_EXIT" \
    --elapsed-seconds "$ATTEMPT_ELAPSED" \
    --artifact-exists "$ARTIFACT_EXISTS" \
    --artifact-complete "$ARTIFACT_COMPLETE" \
    --artifact-size "$ARTIFACT_SIZE"

  if [[ "$ATTEMPT_STATUS" == "success" ]]; then
    SUCCESSFUL_ATTEMPT=$ATTEMPT
    log "  Attempt #$ATTEMPT/$MAX_ATTEMPTS produced a complete index.html"
    break
  fi

  GEN_FAIL_REASON="$ATTEMPT_FAIL_REASON"
  reset_generation_workspace
  log "  Attempt #$ATTEMPT/$MAX_ATTEMPTS failed: $ATTEMPT_FAIL_REASON"
done

if [[ $SUCCESSFUL_ATTEMPT -eq 0 ]]; then
  reset_generation_workspace
else
  restore_task_inputs
fi
publish_generation_attempts
fi

GEN_END_TIME=$(date +%s)
GEN_ELAPSED=$(( GEN_END_TIME - START_TIME ))

if ! index_html_is_complete; then
  log "  Generation failed (${GEN_ELAPSED}s)"
  python3 -c "
import json
try:
    generation = json.load(open('$GENERATION_SUMMARY_FILE'))
except Exception:
    generation = {
        'policy': 'fresh_retry',
        'continuation_enabled': False,
        'max_attempts': $MAX_ATTEMPTS,
        'attempts': $ATTEMPT,
        'successful_attempt': None,
        'token_usage': {},
        'attempt_details': [],
    }
summary = {
    'game': '$GAME',
    'harness': '$HARNESS',
    'model': '$ANTHROPIC_MODEL' if '$HARNESS' == 'claude' else '$OPENAI_MODEL',
    'status': 'GEN_FAIL',
    'gen_time': $GEN_ELAPSED,
    'attempts': generation.get('attempts', $ATTEMPT),
    'max_attempts': $MAX_ATTEMPTS,
    'max_retries': $MAX_RETRIES,
    'failure_reason': '${GEN_FAIL_REASON:-no_index_html}',
    'generation': generation,
}
summary.update(generation.get('token_usage') or {})
with open('$OUTPUT_DIR/summary.json', 'w') as f:
    json.dump(summary, f, indent=2)
"
  exit 1
fi

FILE_SIZE=$(wc -c < "$OUTPUT_DIR/index.html" | tr -d ' ')
log "  Generation succeeded (${GEN_ELAPSED}s, ${FILE_SIZE}B)"

if grep -q '\\!' "$OUTPUT_DIR/index.html" 2>/dev/null; then
  BANG_CNT=$(grep -o '\\!' "$OUTPUT_DIR/index.html" | wc -l | tr -d ' ')
  perl -i -pe 's/\\!/!/g' "$OUTPUT_DIR/index.html"
  log "  \\! fix: replaced ${BANG_CNT} occurrences"
fi

TOTAL_END=$(date +%s)
TOTAL_ELAPSED=$(( TOTAL_END - START_TIME ))

python3 -c "
import json

try:
    generation = json.load(open('$GENERATION_SUMMARY_FILE'))
except Exception:
    generation = {
        'policy': 'existing_artifact',
        'continuation_enabled': False,
        'max_attempts': $MAX_ATTEMPTS,
        'attempts': 0,
        'successful_attempt': None,
        'token_usage': {},
        'attempt_details': [],
    }
token_usage = generation.get('token_usage') or {}

model = '$ANTHROPIC_MODEL' if '$HARNESS' == 'claude' else '$OPENAI_MODEL'
summary = {
    'game': '$GAME',
    'harness': '$HARNESS',
    'model': model,
    'status': 'OK',
    'file_size': $FILE_SIZE,
    'gen_time': $GEN_ELAPSED,
    'total_time': $TOTAL_ELAPSED,
    'attempts': generation.get('attempts', $ATTEMPT),
    'max_attempts': $MAX_ATTEMPTS,
    'max_retries': $MAX_RETRIES,
    'generation': generation,
    'evaluation_status': 'pending',
    'l1': {'passed': None, 'total': None},
    'l2': {'passed': None, 'total': None},
}
summary.update(token_usage)
with open('$OUTPUT_DIR/summary.json', 'w') as f:
    json.dump(summary, f, indent=2)
"

log "Completed | gen=${GEN_ELAPSED}s total=${TOTAL_ELAPSED}s size=${FILE_SIZE}B | Awaiting separate evaluation"
