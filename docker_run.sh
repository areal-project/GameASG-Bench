#!/bin/bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
IMAGE="${DOCKER_IMAGE:-gamebench-env:v2.0}"

GAME=""
MODEL="${ANTHROPIC_MODEL:-claude-opus-4-8}"
HARNESS="claude"
API_KEY_ARG=""
BASE_URL_ARG=""
CODEX_REASONING_EFFORT=""
MAX_TURNS=120
MAX_RETRIES=1
RETRY_DELAY=15
WALL_CAP_SECS=3600
DRY_RUN=0
EXP_ID=""
EXTRA_ENV_ARGS=()

validate_env_assignment() {
  local assignment="$1"
  if [[ ! "$assignment" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
    echo "ERROR: --env requires KEY=VALUE; received: $assignment" >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)       MODEL="$2"; shift 2 ;;
    --harness)     HARNESS="$2"; shift 2 ;;
    --api-key)     API_KEY_ARG="$2"; shift 2 ;;
    --base-url)    BASE_URL_ARG="$2"; shift 2 ;;
    --effort)      CODEX_REASONING_EFFORT="$2"; shift 2 ;;
    --max-turns)   MAX_TURNS="$2"; shift 2 ;;
    --max-retries) MAX_RETRIES="$2"; shift 2 ;;
    --retry-delay) RETRY_DELAY="$2"; shift 2 ;;
    --wall-cap)    WALL_CAP_SECS="$2"; shift 2 ;;
    --exp-id)      EXP_ID="$2"; shift 2 ;;
    --env|-e)      validate_env_assignment "$2"; EXTRA_ENV_ARGS+=("$2"); shift 2 ;;
    --dry-run)     DRY_RUN=1; shift ;;
    -h|--help)
      echo "Usage: $0 <game> [OPTIONS]"
      echo ""
      echo "Run separate generation and evaluation containers in sequence (generation + L1 + L2 + summary)"
      echo ""
      echo "Options:"
      echo "  --harness NAME    Harness: claude|codex (default: claude)"
      echo "  --model NAME      Model name (default: claude-opus-4-8)"
      echo "  --api-key KEY     API key for this run (overrides the harness environment variable)"
      echo "  --base-url URL    Model base URL for this run (overrides the environment variable)"
      echo "  --effort LEVEL    DeepSeek Codex reasoning effort: low|high|max (default: max)"
      echo "  --max-turns N     Maximum Claude turns (default: 120)"
      echo "  --max-retries N   Maximum total generation attempts; each starts from scratch (default: 1)"
      echo "  --retry-delay N   Delay between attempts in seconds (default: 15)"
      echo "  --wall-cap N      Wall-clock limit per generation attempt in seconds (default: 3600)"
      echo "  --exp-id ID       Experiment ID (optional; writes to output/<id>/<game>/)"
      echo "  --env KEY=VALUE   Extra container environment variable (repeatable)"
      echo "  --dry-run         Print Docker commands without executing them"
      echo ""
      echo "Environment variables:"
      echo "  ANTHROPIC_API_KEY   Claude harness API key (required for Claude)"
      echo "  ANTHROPIC_BASE_URL  Claude Base URL (default: https://api.anthropic.com)"
      echo "  OPENAI_API_KEY      Codex harness API key (required for Codex)"
      echo "  OPENAI_BASE_URL     Codex Base URL (default: https://api.openai.com/v1; DeepSeek V4 default: https://api.deepseek.com/)"
      echo "  DOCKER_IMAGE        Docker image (default: gamebench-env:v2.0)"
      exit 0 ;;
    -*) echo "ERROR: Unknown argument: $1" >&2; exit 2 ;;
    *)  GAME="$1"; shift ;;
  esac
done

if [[ -z "$GAME" ]]; then
  echo "ERROR: A game slug is required" >&2
  echo "Usage: $0 <game> [--help]" >&2
  exit 2
fi

[[ "$GAME" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "ERROR: invalid game slug" >&2; exit 2; }
[[ -z "$EXP_ID" || "$EXP_ID" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "ERROR: invalid experiment id" >&2; exit 2; }

if [[ "$HARNESS" != "claude" && "$HARNESS" != "codex" ]]; then
  echo "ERROR: --harness must be claude or codex" >&2
  exit 2
fi

IS_DEEPSEEK_CODEX=0
if [[ "$HARNESS" == "codex" ]]; then
  case "$MODEL" in
    deepseek-v4-flash|deepseek-v4-pro|deepseek-v4-flash-vision-exp)
      IS_DEEPSEEK_CODEX=1
      CODEX_REASONING_EFFORT="${CODEX_REASONING_EFFORT:-max}"
      ;;
  esac
fi

if [[ -n "$CODEX_REASONING_EFFORT" && "$IS_DEEPSEEK_CODEX" -ne 1 ]]; then
  echo "ERROR: --effort is currently supported only for DeepSeek V4 with the codex harness" >&2
  exit 2
fi
if [[ "$IS_DEEPSEEK_CODEX" -eq 1 && ! "$CODEX_REASONING_EFFORT" =~ ^(low|high|max)$ ]]; then
  echo "ERROR: --effort must be low, high, or max" >&2
  exit 2
fi

DEFAULT_ANTHROPIC_BASE_URL="https://api.anthropic.com"
DEFAULT_OPENAI_BASE_URL="https://api.openai.com/v1"
if [[ "$IS_DEEPSEEK_CODEX" -eq 1 ]]; then
  DEFAULT_OPENAI_BASE_URL="https://api.deepseek.com/"
fi
ANTHROPIC_BASE="${BASE_URL_ARG:-${ANTHROPIC_BASE_URL:-$DEFAULT_ANTHROPIC_BASE_URL}}"
OPENAI_BASE="${BASE_URL_ARG:-${OPENAI_BASE_URL:-$DEFAULT_OPENAI_BASE_URL}}"
ANTHROPIC_API_KEY_VALUE=""
OPENAI_API_KEY_VALUE=""

if [[ "$HARNESS" == "claude" ]]; then
  ANTHROPIC_API_KEY_VALUE="${API_KEY_ARG:-${ANTHROPIC_API_KEY:-}}"
  if [[ -z "$ANTHROPIC_API_KEY_VALUE" ]]; then
    echo "ERROR: claude harness requires ANTHROPIC_API_KEY or an explicit --api-key" >&2
    exit 2
  fi
elif [[ "$HARNESS" == "codex" ]]; then
  OPENAI_API_KEY_VALUE="${API_KEY_ARG:-${OPENAI_API_KEY:-}}"
  if [[ -z "$OPENAI_API_KEY_VALUE" ]]; then
    echo "ERROR: codex harness requires OPENAI_API_KEY or an explicit --api-key" >&2
    exit 2
  fi
fi

DEEPSEEK_MODELS_FILE="$HERE/config/codex/deepseek-models.json"
if [[ "$IS_DEEPSEEK_CODEX" -eq 1 && ! -f "$DEEPSEEK_MODELS_FILE" ]]; then
  echo "ERROR: DeepSeek Codex model catalog not found: $DEEPSEEK_MODELS_FILE" >&2
  exit 2
fi

[[ -d "$HERE/task/$GAME" ]] || { echo "ERROR: task/$GAME not found" >&2; exit 2; }
[[ -d "$HERE/tests/$GAME" ]] || { echo "ERROR: tests/$GAME not found" >&2; exit 2; }
for task_file in target.md game-spec.md tdd.md; do
  [[ -f "$HERE/task/$GAME/$task_file" ]] || { echo "ERROR: task/$GAME/$task_file not found" >&2; exit 2; }
done

if [[ -n "$EXP_ID" ]]; then
  OUTPUT_DIR="$HERE/output/$EXP_ID/$GAME"
else
  OUTPUT_DIR="$HERE/output/$GAME"
fi
run_evaluation() {
  local args=("$GAME")
  [[ -z "$EXP_ID" ]] || args+=(--exp-id "$EXP_ID")
  [[ "$DRY_RUN" -eq 0 ]] || args+=(--dry-run)
  DOCKER_IMAGE="$IMAGE" bash "$HERE/docker_test.sh" "${args[@]}"
}

if [[ "$DRY_RUN" -eq 0 && -f "$OUTPUT_DIR/index.html" && ! -L "$OUTPUT_DIR/index.html" && -s "$OUTPUT_DIR/index.html" ]] \
  && grep -Eiq '</html[[:space:]]*>' "$OUTPUT_DIR/index.html"; then
  echo "Complete index.html already exists; starting separate evaluation."
  run_evaluation
  exit $?
fi

GEN_ROOT=""
GEN_CONTAINER=""
cleanup_generation() {
  if [[ -n "$GEN_CONTAINER" ]]; then
    docker rm -f "$GEN_CONTAINER" >/dev/null 2>&1 || true
  fi
  [[ -z "$GEN_ROOT" ]] || rm -rf -- "$GEN_ROOT"
}
trap cleanup_generation EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ "$DRY_RUN" -eq 1 ]]; then
  GEN_WORKSPACE="/tmp/gamebench-generation.DRY-RUN/workspace"
else
  GEN_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/gamebench-generation.XXXXXX")
  GEN_CONTAINER="$(basename "$GEN_ROOT")"
  GEN_WORKSPACE="$GEN_ROOT/workspace"
  mkdir "$GEN_WORKSPACE"
  chmod 755 "$GEN_ROOT"
  chmod 777 "$GEN_WORKSPACE"
  for task_file in target.md game-spec.md tdd.md; do
    cp "$HERE/task/$GAME/$task_file" "$GEN_WORKSPACE/$task_file"
    chmod 0444 "$GEN_WORKSPACE/$task_file"
  done
fi

DOCKER_CMD=(
  docker run --rm
  --mount "type=bind,src=$GEN_WORKSPACE,dst=/envarena/workspace"
  --mount "type=bind,src=$HERE/scripts/generation_attempts.py,dst=/envarena/scripts/generation_attempts.py,readonly"
  --mount "type=bind,src=$HERE/docker_entrypoint.sh,dst=/envarena/docker_entrypoint.sh,readonly"
  -e "GAME=$GAME"
  -e "HARNESS=$HARNESS"
  -e "ANTHROPIC_MODEL=$MODEL"
  -e "OPENAI_MODEL=$MODEL"
  -e "MAX_TURNS=$MAX_TURNS"
  -e "MAX_RETRIES=$MAX_RETRIES"
  -e "RETRY_DELAY=$RETRY_DELAY"
  -e "WALL_CAP_SECS=$WALL_CAP_SECS"
  -e "HOME=/home/admin"
  -w /envarena/workspace
)

[[ -z "$GEN_CONTAINER" ]] || DOCKER_CMD+=(--name "$GEN_CONTAINER")

if [[ "$HARNESS" == "claude" ]]; then
  DOCKER_CMD+=( -e "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY_VALUE" -e "ANTHROPIC_BASE_URL=$ANTHROPIC_BASE" )
elif [[ "$HARNESS" == "codex" ]]; then
  DOCKER_CMD+=( -e "OPENAI_API_KEY=$OPENAI_API_KEY_VALUE" -e "OPENAI_BASE_URL=$OPENAI_BASE" )
  if [[ "$IS_DEEPSEEK_CODEX" -eq 1 ]]; then
    DOCKER_CMD+=(
      --mount "type=bind,src=$DEEPSEEK_MODELS_FILE,dst=/envarena/config/deepseek-models.json,readonly"
      -e "CODEX_DEEPSEEK_MODELS_FILE=/envarena/config/deepseek-models.json"
      -e "CODEX_REASONING_EFFORT=$CODEX_REASONING_EFFORT"
    )
  fi
fi

if [[ ${#EXTRA_ENV_ARGS[@]} -gt 0 ]]; then
  for env_arg in "${EXTRA_ENV_ARGS[@]}"; do
    DOCKER_CMD+=( -e "$env_arg" )
  done
fi

DOCKER_CMD+=(
  --user admin
  --entrypoint bash
  "$IMAGE"
  /envarena/docker_entrypoint.sh
)

if [[ $DRY_RUN -eq 1 ]]; then
  echo "═══ DRY RUN ═══"
  PRINT_CMD=("${DOCKER_CMD[@]}")
  for i in "${!PRINT_CMD[@]}"; do
    case "${PRINT_CMD[$i]}" in
      ANTHROPIC_API_KEY=*|OPENAI_API_KEY=*|*API_KEY=*|*AUTH_TOKEN=*|*TOKEN=*|*SECRET=*)
        PRINT_CMD[$i]="${PRINT_CMD[$i]%%=*}=***"
        ;;
    esac
  done
  echo "${PRINT_CMD[*]}"
  run_evaluation
  exit 0
fi

echo "════════════════════════════════════════════════════════════"
echo "  Docker Pipeline | $GAME | $HARNESS | $MODEL"
echo "  Output: $OUTPUT_DIR/"
echo "════════════════════════════════════════════════════════════"

GEN_RC=0
"${DOCKER_CMD[@]}" || GEN_RC=$?
docker rm -f "$GEN_CONTAINER" >/dev/null 2>&1 || true
GEN_CONTAINER=""

python3 - "$GEN_WORKSPACE" "$OUTPUT_DIR" <<'PY'
import json
from pathlib import Path
import shutil
import sys

source, destination = map(Path, sys.argv[1:])
selected = ('index.html', 'generation.json', 'summary.json', 'generation-attempts')
for name in selected:
    path = source / name
    if path.is_symlink() or (path.is_dir() and any(p.is_symlink() for p in path.rglob('*'))):
        raise SystemExit(f'Refusing symlink in generation output: {name}')
destination.mkdir(parents=True, exist_ok=True)
for name in (*selected, 'report-l1.json', 'report-l2.json', 'summary-test.json', 'test.log', 'l2-stderr.log', 'l2-runner.log'):
    old = destination / name
    if old.is_dir() and not old.is_symlink():
        shutil.rmtree(old)
    elif old.exists() or old.is_symlink():
        old.unlink()
for name in selected:
    path = source / name
    if path.is_dir():
        shutil.copytree(path, destination / name)
    elif path.is_file():
        shutil.copy2(path, destination / name)
summary_path = destination / 'summary.json'
if summary_path.is_file():
    summary = json.loads(summary_path.read_text())
    summary['l1'] = {'passed': None, 'total': None}
    summary['l2'] = {'passed': None, 'total': None}
    summary['evaluation_status'] = 'not_run'
    summary_path.write_text(json.dumps(summary, indent=2) + '\n')
PY

cleanup_generation
GEN_ROOT=""
[[ "$GEN_RC" -eq 0 ]] || exit "$GEN_RC"
[[ -f "$OUTPUT_DIR/index.html" && ! -L "$OUTPUT_DIR/index.html" && -s "$OUTPUT_DIR/index.html" ]] \
  && grep -Eiq '</html[[:space:]]*>' "$OUTPUT_DIR/index.html" \
  || { echo "ERROR: generation produced no complete index.html" >&2; exit 2; }
run_evaluation
EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 && -f "$OUTPUT_DIR/summary.json" ]]; then
  echo ""
  echo "═══ Results ═══"
  python3 -c "
import json
s = json.load(open('$OUTPUT_DIR/summary.json'))
print(f\"  Status: {s['status']}\")
print(f\"  Generation: {s['gen_time']}s, {s['file_size']}B\")
print(f\"  L1: {s['l1']['passed']}/{s['l1']['total']}\")
print(f\"  L2: {s['l2']['passed']}/{s['l2']['total']}\")
" 2>/dev/null || true
fi

exit $EXIT_CODE
