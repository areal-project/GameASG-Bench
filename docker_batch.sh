#!/bin/bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TASK_DIR="$HERE/task"
TESTS_DIR="$HERE/tests"
LOGDIR="$HERE/logs"
mkdir -p "$LOGDIR"

FROM=1
TO=999
ONLY=""
SKIP_EXISTING=1
MODEL="${ANTHROPIC_MODEL:-claude-opus-4-8}"
HARNESS="claude"
API_KEY_ARG=""
BASE_URL_ARG=""
CODEX_REASONING_EFFORT=""
MAX_TURNS=120
MAX_RETRIES=1
RETRY_DELAY=15
WALL_CAP_SECS=3600
COOLDOWN=10
JOBS=1
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
    --from)        FROM="$2"; shift 2 ;;
    --to)          TO="$2"; shift 2 ;;
    --only)        ONLY="$2"; shift 2 ;;
    --no-skip)     SKIP_EXISTING=0; shift ;;
    --model)       MODEL="$2"; shift 2 ;;
    --harness)     HARNESS="$2"; shift 2 ;;
    --api-key)     API_KEY_ARG="$2"; shift 2 ;;
    --base-url)    BASE_URL_ARG="$2"; shift 2 ;;
    --effort)      CODEX_REASONING_EFFORT="$2"; shift 2 ;;
    --max-turns)   MAX_TURNS="$2"; shift 2 ;;
    --max-retries) MAX_RETRIES="$2"; shift 2 ;;
    --retry-delay) RETRY_DELAY="$2"; shift 2 ;;
    --wall-cap)    WALL_CAP_SECS="$2"; shift 2 ;;
    --cooldown)    COOLDOWN="$2"; shift 2 ;;
    --jobs)        JOBS="$2"; shift 2 ;;
    --exp-id)      EXP_ID="$2"; shift 2 ;;
    --env|-e)      validate_env_assignment "$2"; EXTRA_ENV_ARGS+=("$2"); shift 2 ;;
    --dry-run)     DRY_RUN=1; shift ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Generate and evaluate all games in Docker containers."
      echo ""
      echo "Options:"
      echo "  --from N         Start at game N (default: 1)"
      echo "  --to N           End at game N (default: all)"
      echo "  --only slugs     Run only the specified games (comma-separated)"
      echo "  --no-skip        Regenerate games with existing outputs"
      echo "  --model NAME     Model name (default: claude-opus-4-8)"
      echo "  --harness NAME   Harness: claude|codex (default: claude)"
      echo "  --api-key KEY    API key for this run (overrides the harness environment variable)"
      echo "  --base-url URL   Model base URL for this run (overrides the environment variable)"
      echo "  --effort LEVEL   DeepSeek Codex reasoning effort: low|high|max (default: max)"
      echo "  --max-turns N    Maximum Claude turns (default: 120)"
      echo "  --max-retries N  Maximum total generation attempts; each starts from scratch (default: 1)"
      echo "  --retry-delay N  Delay between generation attempts in seconds (default: 15)"
      echo "  --wall-cap N     Wall-clock limit per generation attempt in seconds (default: 3600)"
      echo "  --cooldown N     Delay between game launches in seconds (default: 10)"
      echo "  --jobs N         Number of concurrent games (default: 1)"
      echo "  --exp-id ID      Experiment ID (defaults to an automatically generated timestamp)"
      echo "  --env KEY=VALUE  Extra container environment variable (repeatable)"
      echo "  --dry-run        List games without running them"
      echo ""
      echo "Environment variables:"
      echo "  ANTHROPIC_API_KEY   Claude harness API key (required for Claude)"
      echo "  ANTHROPIC_BASE_URL  Claude Base URL (default: https://api.anthropic.com)"
      echo "  OPENAI_API_KEY      Codex harness API key (required for Codex)"
      echo "  OPENAI_BASE_URL     Codex Base URL (default: https://api.openai.com/v1; DeepSeek V4 default: https://api.deepseek.com/)"
      echo ""
      echo "Results: output/<exp-id>/<game>/summary.json + output/<exp-id>/report.md + logs/batch-docker-results.tsv"
      exit 0 ;;
    -*) echo "ERROR: Unknown argument: $1" >&2; exit 2 ;;
    *)  echo "ERROR: Unknown argument: $1" >&2; exit 2 ;;
  esac
done

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

if [[ "$HARNESS" == "claude" && -z "$API_KEY_ARG" && -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "ERROR: claude harness requires ANTHROPIC_API_KEY or an explicit --api-key" >&2
  exit 2
fi

if [[ "$HARNESS" == "codex" && -z "$API_KEY_ARG" && -z "${OPENAI_API_KEY:-}" ]]; then
  echo "ERROR: codex harness requires OPENAI_API_KEY or an explicit --api-key" >&2
  exit 2
fi

if [[ ! "$JOBS" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: --jobs must be a positive integer" >&2
  exit 2
fi

if [[ -z "$EXP_ID" ]]; then
  EXP_ID=$(date +%Y%m%d-%H%M%S)
fi
OUTPUT_BASE="$HERE/output/$EXP_ID"
mkdir -p "$OUTPUT_BASE"
BATCH_STATUS_DIR="$OUTPUT_BASE/.batch-status"
BATCH_LOG_DIR="$OUTPUT_BASE/.batch-logs"
mkdir -p "$BATCH_STATUS_DIR" "$BATCH_LOG_DIR"
rm -f "$BATCH_STATUS_DIR"/*.tsv "$BATCH_LOG_DIR"/*.log 2>/dev/null || true

GAMES=()
for d in "$TASK_DIR"/*/; do
  slug=$(basename "$d")
  [[ -f "$TASK_DIR/$slug/target.md" ]] || continue
  [[ -f "$TASK_DIR/$slug/game-spec.md" ]] || continue
  [[ -f "$TASK_DIR/$slug/tdd.md" ]] || continue
  [[ -f "$TESTS_DIR/$slug/checks.json" ]] || continue
  [[ -f "$TESTS_DIR/$slug/checks.js" ]] || continue
  GAMES+=("$slug")
done

if [[ ${#GAMES[@]} -eq 0 ]]; then
  echo "ERROR: No eligible games found. Each game requires task/<game>/target.md, game-spec.md, tdd.md, and tests/<game>/checks.json/checks.js" >&2
  exit 2
fi

IFS=$'\n' GAMES=($(printf '%s\n' "${GAMES[@]}" | sort)); unset IFS
TOTAL=${#GAMES[@]}

echo "════════════════════════════════════════════════════════════"
echo "  Batch Docker Pipeline | $HARNESS | $MODEL | $TOTAL games"
echo "  Experiment ID: $EXP_ID"
echo "  Output: $OUTPUT_BASE/"
echo "  Options: max-turns=$MAX_TURNS generation-attempts=$MAX_RETRIES retry-delay=${RETRY_DELAY}s wall-cap=${WALL_CAP_SECS}s cooldown=${COOLDOWN}s jobs=$JOBS"
[[ "$IS_DEEPSEEK_CODEX" -eq 1 ]] && echo "  DeepSeek Codex: effort=$CODEX_REASONING_EFFORT"
echo "════════════════════════════════════════════════════════════"
echo ""

if [[ $TOTAL -eq 0 ]]; then
  echo "No games match the selection criteria." >&2
  exit 0
fi

RESULTS_FILE="$LOGDIR/batch-docker-results.tsv"
if [[ ! -f "$RESULTS_FILE" ]]; then
  echo -e "game\tstatus\tgen_time\tfile_size\tl1_pass\tl1_total\tl2_pass\tl2_total\ttimestamp" > "$RESULTS_FILE"
fi

TOTAL_OK=0
TOTAL_FAIL=0
TOTAL_SKIP=0
STARTED_AT=$(date +%s)

status_file_for() {
  local idx=$1
  local slug=$2
  local prefix
  prefix=$(printf "%05d" "$idx")
  echo "$BATCH_STATUS_DIR/$prefix-$slug.tsv"
}

log_file_for() {
  local idx=$1
  local slug=$2
  local prefix
  prefix=$(printf "%05d" "$idx")
  echo "$BATCH_LOG_DIR/$prefix-$slug.log"
}

write_status_row() {
  local idx=$1
  local slug=$2
  local status=$3
  local gen_time=$4
  local file_size=$5
  local l1_pass=$6
  local l1_total=$7
  local l2_pass=$8
  local l2_total=$9
  local status_file
  status_file=$(status_file_for "$idx" "$slug")
  printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
    "$slug" "$status" "$gen_time" "$file_size" \
    "$l1_pass" "$l1_total" "$l2_pass" "$l2_total" "$(date '+%H:%M:%S')" \
    > "$status_file"
}

process_game() {
  local idx=$1
  local slug=$2
  local output_dir="$OUTPUT_BASE/$slug"

  echo ""
  echo "━━━ [$idx/$TOTAL] $slug ━━━"

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "  (dry-run) ./docker_run.sh $slug --harness $HARNESS --model $MODEL --max-turns $MAX_TURNS --max-retries $MAX_RETRIES --retry-delay $RETRY_DELAY --wall-cap $WALL_CAP_SECS --exp-id $EXP_ID"
    [[ -n "$BASE_URL_ARG" ]] && echo "            --base-url $BASE_URL_ARG"
    [[ "$IS_DEEPSEEK_CODEX" -eq 1 ]] && echo "            --effort $CODEX_REASONING_EFFORT"
    [[ -n "$API_KEY_ARG" ]] && echo "            --api-key ***"
    if [[ ${#EXTRA_ENV_ARGS[@]} -gt 0 ]]; then
      for env_arg in "${EXTRA_ENV_ARGS[@]}"; do
        case "$env_arg" in
          *API_KEY=*|*AUTH_TOKEN=*|*TOKEN=*|*SECRET=*)
            echo "            --env ${env_arg%%=*}=***"
            ;;
          *)
            echo "            --env $env_arg"
            ;;
        esac
      done
    fi
    return 0
  fi

  if [[ "$output_dir" != "$OUTPUT_BASE/"* || "$output_dir" == "$OUTPUT_BASE" ]]; then
    echo "ERROR: Refusing to clean a directory outside the experiment game path: $output_dir" >&2
    return 1
  fi
  rm -rf -- "$output_dir"
  mkdir -p "$output_dir"

  local start_time=$(date +%s)

  local run_args=(
    "$HERE/docker_run.sh" "$slug"
    --harness "$HARNESS"
    --model "$MODEL"
    --max-turns "$MAX_TURNS"
    --max-retries "$MAX_RETRIES"
    --retry-delay "$RETRY_DELAY"
    --wall-cap "$WALL_CAP_SECS"
    --exp-id "$EXP_ID"
  )
  [[ -n "$API_KEY_ARG" ]] && run_args+=(--api-key "$API_KEY_ARG")
  [[ -n "$BASE_URL_ARG" ]] && run_args+=(--base-url "$BASE_URL_ARG")
  [[ "$IS_DEEPSEEK_CODEX" -eq 1 ]] && run_args+=(--effort "$CODEX_REASONING_EFFORT")
  if [[ ${#EXTRA_ENV_ARGS[@]} -gt 0 ]]; then
    for env_arg in "${EXTRA_ENV_ARGS[@]}"; do
      run_args+=(--env "$env_arg")
    done
  fi

  "${run_args[@]}" || true

  local end_time=$(date +%s)
  local elapsed=$(( end_time - start_time ))

  if [[ -f "$output_dir/summary.json" ]]; then
    local status gen_time file_size l1_pass l1_total l2_pass l2_total
    status=$(python3 -c "import json; print(json.load(open('$output_dir/summary.json')).get('status','?'))" 2>/dev/null || echo "?")
    gen_time=$(python3 -c "import json; print(json.load(open('$output_dir/summary.json')).get('gen_time','?'))" 2>/dev/null || echo "?")
    file_size=$(python3 -c "import json; print(json.load(open('$output_dir/summary.json')).get('file_size','?'))" 2>/dev/null || echo "?")
    l1_pass=$(python3 -c "import json; print(json.load(open('$output_dir/summary.json'))['l1']['passed'])" 2>/dev/null || echo "?")
    l1_total=$(python3 -c "import json; print(json.load(open('$output_dir/summary.json'))['l1']['total'])" 2>/dev/null || echo "?")
    l2_pass=$(python3 -c "import json; print(json.load(open('$output_dir/summary.json'))['l2']['passed'])" 2>/dev/null || echo "?")
    l2_total=$(python3 -c "import json; print(json.load(open('$output_dir/summary.json'))['l2']['total'])" 2>/dev/null || echo "?")

    write_status_row "$idx" "$slug" "$status" "${gen_time}s" "${file_size}B" "$l1_pass" "$l1_total" "$l2_pass" "$l2_total"

    if [[ "$status" == "OK" ]]; then
      echo "  ✓ $slug | gen=${gen_time}s ${file_size}B | L1=${l1_pass}/${l1_total} L2=${l2_pass}/${l2_total}"
    else
      echo "  ✗ $slug | $status (${elapsed}s)"
    fi
  else
    echo "  ✗ $slug | Missing summary (${elapsed}s)"
    write_status_row "$idx" "$slug" "FAIL" "${elapsed}s" "0" "-" "-" "-" "-"
  fi
}

RUN_IDXS=()
RUN_SLUGS=()

enqueue_game() {
  local idx=$1
  local slug=$2
  local output_dir="$OUTPUT_BASE/$slug"

  if [[ "$SKIP_EXISTING" -eq 1 && -f "$output_dir/index.html" && -f "$output_dir/summary.json" ]]; then
    echo "  ⊘ [$idx/$TOTAL] $slug — Already exists; skipping"
    write_status_row "$idx" "$slug" "SKIP" "-" "-" "-" "-" "-" "-"
    return 0
  fi

  RUN_IDXS+=("$idx")
  RUN_SLUGS+=("$slug")
}

if [[ -n "$ONLY" ]]; then
  IFS=',' read -ra ONLY_LIST <<< "$ONLY"
  local_idx=0
  for slug in "${ONLY_LIST[@]}"; do
    ((local_idx++)) || true
    found=0
    for g in "${GAMES[@]}"; do
      if [[ "$g" == "$slug" ]]; then found=1; break; fi
    done
    if [[ $found -eq 1 ]]; then
      enqueue_game "$local_idx" "$slug"
    else
      echo "  WARNING: $slug is not in the eligible game list; skipping"
    fi
  done
else
  idx=0
  for slug in "${GAMES[@]}"; do
    ((idx++)) || true
    [[ $idx -lt $FROM ]] && continue
    [[ $idx -gt $TO ]] && break
    enqueue_game "$idx" "$slug"
  done
fi

RUN_TOTAL=${#RUN_SLUGS[@]}

recount_status() {
  TOTAL_OK=0
  TOTAL_FAIL=0
  TOTAL_SKIP=0
  local file status
  for file in "$BATCH_STATUS_DIR"/*.tsv; do
    [[ -f "$file" ]] || continue
    status=$(awk -F '\t' 'NR==1 {print $2}' "$file" 2>/dev/null || echo "FAIL")
    case "$status" in
      OK) ((TOTAL_OK++)) || true ;;
      SKIP) ((TOTAL_SKIP++)) || true ;;
      *) ((TOTAL_FAIL++)) || true ;;
    esac
  done
}

merge_status_rows() {
  local file
  for file in "$BATCH_STATUS_DIR"/*.tsv; do
    [[ -f "$file" ]] || continue
    cat "$file" >> "$RESULTS_FILE"
  done
}

print_finished_job() {
  local idx=$1
  local slug=$2
  local status_file
  local log_file
  local status
  status_file=$(status_file_for "$idx" "$slug")
  log_file=$(log_file_for "$idx" "$slug")
  if [[ ! -f "$status_file" ]]; then
    write_status_row "$idx" "$slug" "FAIL" "-" "0" "-" "-" "-" "-"
  fi
  status=$(awk -F '\t' 'NR==1 {print $2}' "$status_file" 2>/dev/null || echo "FAIL")

  if [[ "$status" == "OK" ]]; then
    echo "  ✓ [$idx/$TOTAL] $slug Completed"
  else
    echo "  ✗ [$idx/$TOTAL] $slug failed/did not pass; log: $log_file"
  fi
}

ACTIVE_PIDS=()
ACTIVE_IDXS=()
ACTIVE_SLUGS=()

reap_finished_jobs() {
  local next_pids=()
  local next_idxs=()
  local next_slugs=()
  local i pid idx slug

  for i in "${!ACTIVE_PIDS[@]}"; do
    pid="${ACTIVE_PIDS[$i]}"
    idx="${ACTIVE_IDXS[$i]}"
    slug="${ACTIVE_SLUGS[$i]}"

    if kill -0 "$pid" 2>/dev/null; then
      next_pids+=("$pid")
      next_idxs+=("$idx")
      next_slugs+=("$slug")
    else
      wait "$pid" 2>/dev/null || true
      print_finished_job "$idx" "$slug"
    fi
  done

  if [[ ${#next_pids[@]} -gt 0 ]]; then
    ACTIVE_PIDS=("${next_pids[@]}")
    ACTIVE_IDXS=("${next_idxs[@]}")
    ACTIVE_SLUGS=("${next_slugs[@]}")
  else
    ACTIVE_PIDS=()
    ACTIVE_IDXS=()
    ACTIVE_SLUGS=()
  fi
}

wait_for_slot() {
  while [[ ${#ACTIVE_PIDS[@]} -ge $JOBS ]]; do
    reap_finished_jobs
    [[ ${#ACTIVE_PIDS[@]} -lt $JOBS ]] && break
    sleep 2
  done
}

wait_for_all_jobs() {
  while [[ ${#ACTIVE_PIDS[@]} -gt 0 ]]; do
    reap_finished_jobs
    [[ ${#ACTIVE_PIDS[@]} -eq 0 ]] && break
    sleep 2
  done
}

run_queue() {
  local i idx slug log_file pid

  if [[ $RUN_TOTAL -eq 0 ]]; then
    echo "No games to run."
    return 0
  fi

  if [[ $DRY_RUN -eq 1 || $JOBS -eq 1 ]]; then
    for i in "${!RUN_SLUGS[@]}"; do
      idx="${RUN_IDXS[$i]}"
      slug="${RUN_SLUGS[$i]}"
      process_game "$idx" "$slug" || write_status_row "$idx" "$slug" "FAIL" "-" "0" "-" "-" "-" "-"
      if [[ $DRY_RUN -eq 0 && $COOLDOWN -gt 0 && $i -lt $((RUN_TOTAL - 1)) ]]; then
        sleep "$COOLDOWN"
      fi
    done
    return 0
  fi

  echo "  Parallel execution: jobs=$JOBS, $RUN_TOTAL games queued"

  for i in "${!RUN_SLUGS[@]}"; do
    idx="${RUN_IDXS[$i]}"
    slug="${RUN_SLUGS[$i]}"
    log_file=$(log_file_for "$idx" "$slug")

    wait_for_slot

    (process_game "$idx" "$slug" || write_status_row "$idx" "$slug" "FAIL" "-" "0" "-" "-" "-" "-") > "$log_file" 2>&1 &
    pid=$!
    ACTIVE_PIDS+=("$pid")
    ACTIVE_IDXS+=("$idx")
    ACTIVE_SLUGS+=("$slug")
    echo "  ▶ [$idx/$TOTAL] $slug started pid=$pid log: $log_file"

    if [[ $COOLDOWN -gt 0 && $i -lt $((RUN_TOTAL - 1)) ]]; then
      sleep "$COOLDOWN"
    fi
  done

  wait_for_all_jobs
}

run_queue

if [[ $DRY_RUN -eq 0 ]]; then
  merge_status_rows
fi
recount_status

ENDED_AT=$(date +%s)
ELAPSED=$(( ENDED_AT - STARTED_AT ))

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Batch complete - total elapsed time: ${ELAPSED}s"
echo "  Succeeded: $TOTAL_OK | Failed: $TOTAL_FAIL | Skipped: $TOTAL_SKIP"
echo "  Results: $RESULTS_FILE"
echo "  Output: $OUTPUT_BASE/"
echo "════════════════════════════════════════════════════════════"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ $DRY_RUN -eq 0 ]]; then
  python3 "$SCRIPT_DIR/scripts/gen_report.py" --exp-dir "$OUTPUT_BASE"
else
  echo "  dry-run: Skipping report.md generation"
fi
