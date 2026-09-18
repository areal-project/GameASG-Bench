#!/bin/bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
IMAGE="${DOCKER_IMAGE:-gamebench-env:v2.0}"

GAME=""
EXP_ID=""
MODE="single"
ONLY_LIST=""
DRY_RUN=0
L2_DURATION=30
TEST_PHASE="all"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --exp-id)    EXP_ID="$2"; shift 2 ;;
    --all)       MODE="all"; shift ;;
    --only)      MODE="only"; ONLY_LIST="$2"; shift 2 ;;
    --duration)  L2_DURATION="$2"; shift 2 ;;
    --phase|--test-phase)
                  TEST_PHASE="$2"; shift 2 ;;
    --all-tests)  TEST_PHASE="all"; shift ;;
    --l1-only)    TEST_PHASE="l1"; shift ;;
    --l2-only)    TEST_PHASE="l2"; shift ;;
    --dry-run)   DRY_RUN=1; shift ;;
    -h|--help)
      echo "Usage: $0 [<game>] [--exp-id <id>] [--all|--only g1,g2] [--phase all|l1|l2] [--duration 30] [--dry-run]"
      echo ""
      echo "Run L1/L2 checks on existing index.html files in Docker containers."
      echo ""
      echo "Options:"
      echo "  <game>          Single game slug"
      echo "  --exp-id ID     Experiment ID (uses output/<exp-id>/; output/ if omitted)"
      echo "  --all           Evaluate all games with an existing index.html"
      echo "  --only g1,g2    Evaluate only the specified games"
      echo "  --phase MODE    Evaluation phase: all|l1|l2 (default: all)"
      echo "  --all-tests     Run L1+L2 (equivalent to --phase all)"
      echo "  --l1-only       Run only L1 static checks"
      echo "  --l2-only       Run only L2 runtime checks"
      echo "  --duration N    L2 duration parameter in seconds (default: 30)"
      echo "  --dry-run       Print commands without executing them"
      echo ""
      echo "Environment:"
      echo "  DOCKER_IMAGE    Docker image tag or digest (default: gamebench-env:v2.0)"
      exit 0 ;;
    -*)
      echo "Unknown arg: $1" >&2; exit 2 ;;
    *)
      if [[ -z "$GAME" ]]; then GAME="$1"; fi
      shift ;;
  esac
done

[[ -z "$EXP_ID" || "$EXP_ID" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "ERROR: invalid experiment id" >&2; exit 2; }

if [[ "$TEST_PHASE" != "all" && "$TEST_PHASE" != "l1" && "$TEST_PHASE" != "l2" ]]; then
  echo "ERROR: --phase must be one of: all, l1, l2" >&2
  exit 2
fi

OUTPUT_BASE="$HERE/output${EXP_ID:+/$EXP_ID}"

if [[ "$DRY_RUN" -eq 0 && ! -d "$OUTPUT_BASE" ]]; then
  echo "ERROR: output dir not found: $OUTPUT_BASE" >&2
  exit 2
fi

GAMES=()

case "$MODE" in
  single)
    if [[ -z "$GAME" ]]; then
      echo "ERROR: game slug required (or use --all / --only)" >&2; exit 2
    fi
    GAMES=("$GAME")
    ;;
  all)
    for d in "$OUTPUT_BASE"/*/; do
      g="$(basename "$d")"
      if [[ -f "$d/index.html" ]]; then
        GAMES+=("$g")
      fi
    done
    ;;
  only)
    IFS=',' read -ra GAMES <<< "$ONLY_LIST"
    ;;
esac

if [[ ${#GAMES[@]} -eq 0 ]]; then
  echo "ERROR: no games to test" >&2; exit 2
fi

IFS=$'\n' GAMES=($(sort <<<"${GAMES[*]}")); unset IFS

echo "═══════════════════════════════════════════════════"
echo " Test-only mode | exp=$EXP_ID | games=${#GAMES[@]} | phase=$TEST_PHASE | image=$IMAGE"
echo "═══════════════════════════════════════════════════"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
EVAL_ROOT=""
EVAL_CONTAINER=""
cleanup_evaluation() {
  if [[ -n "$EVAL_CONTAINER" ]]; then
    docker rm -f "$EVAL_CONTAINER" >/dev/null 2>&1 || true
  fi
  [[ -z "$EVAL_ROOT" ]] || rm -rf -- "$EVAL_ROOT"
}
trap cleanup_evaluation EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

run_test() {
  local game="$1"
  local game_output="$OUTPUT_BASE/$game"
  local html_file="$game_output/index.html"
  [[ "$game" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "ERROR: invalid game slug" >&2; exit 2; }

  if [[ "$DRY_RUN" -eq 0 && ( ! -f "$html_file" || -L "$html_file" ) ]]; then
    echo "[$game] FAIL — index.html must be a regular file, not a symlink"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    return
  fi

  if [[ ! -d "$HERE/tests/$game" ]]; then
    echo "[$game] FAIL — no tests dir"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    return
  fi

  local eval_workspace="/tmp/gamebench-evaluation.DRY-RUN"
  if [[ "$DRY_RUN" -eq 0 ]]; then
    EVAL_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/gamebench-evaluation.XXXXXX")
    EVAL_CONTAINER="$(basename "$EVAL_ROOT")"
    eval_workspace="$EVAL_ROOT"
    mkdir "$EVAL_ROOT/input" "$EVAL_ROOT/reports"
    chmod 755 "$EVAL_ROOT" "$EVAL_ROOT/input"
    chmod 777 "$EVAL_ROOT/reports"
    cp "$html_file" "$EVAL_ROOT/input/index.html"
    chmod 0444 "$EVAL_ROOT/input/index.html"
  fi

  local docker_cmd=(
    docker run --rm
    --mount "type=bind,src=$HERE/tests/$game,dst=/envarena/tests/$game,readonly"
    --mount "type=bind,src=$HERE/scripts/l1,dst=/envarena/scripts/l1,readonly"
    --mount "type=bind,src=$HERE/scripts/l2,dst=/envarena/scripts/l2,readonly"
    --mount "type=bind,src=$eval_workspace/input,dst=/envarena/input,readonly"
    --mount "type=bind,src=$eval_workspace/reports,dst=/envarena/reports"
    --mount "type=bind,src=$HERE/docker_test_entrypoint.sh,dst=/envarena/docker_test_entrypoint.sh,readonly"
    -e "GAME=$game"
    -e "TEST_PHASE=$TEST_PHASE"
    -e "L2_DURATION=$L2_DURATION"
    -e "HOME=/home/admin"
    --user admin
    -w /envarena/reports
    --entrypoint bash
  )
  [[ -z "$EVAL_CONTAINER" ]] || docker_cmd+=(--name "$EVAL_CONTAINER")
  docker_cmd+=("$IMAGE" /envarena/docker_test_entrypoint.sh)

  if [[ $DRY_RUN -eq 1 ]]; then
    printf '[%s] DRY-RUN — ' "$game"
    printf '%q ' "${docker_cmd[@]}"
    printf '\n'
    return
  fi

  echo -n "[$game] testing... "
  local rc=0
  "${docker_cmd[@]}" \
    > "$EVAL_ROOT/test.log" 2>&1 || rc=$?
  docker rm -f "$EVAL_CONTAINER" >/dev/null 2>&1 || true
  EVAL_CONTAINER=""

  python3 - "$EVAL_ROOT" "$game_output" "$TEST_PHASE" "$game" "$rc" <<'PY'
import json
from pathlib import Path
import shutil
import sys

root, output = map(Path, sys.argv[1:3])
phase, game, rc = sys.argv[3:]
needed = ('l1', 'l2') if phase == 'all' else (phase,)
report_root = root / 'reports'
files = ['summary-test.json'] + [f'report-{name}.json' for name in needed]
if 'l2' in needed:
    files += ['l2-stderr.log']
for name in files:
    target = output / name
    if target.is_symlink():
        target.unlink()
    elif target.is_dir():
        raise SystemExit(f'Refusing report directory: {target}')
    elif target.exists():
        target.unlink()
    source = report_root / name
    if source.is_symlink():
        raise SystemExit(f'Refusing symlink report: {source}')
    if source.is_file():
        shutil.copy2(source, target)
log = output / 'test.log'
if log.is_symlink():
    log.unlink()
shutil.copy2(root / 'test.log', log)
summary_path = output / 'summary.json'
if summary_path.is_symlink():
    raise SystemExit('Refusing symlink summary.json')
summary = json.loads(summary_path.read_text()) if summary_path.is_file() else {'game': game}
test_path = output / 'summary-test.json'
test = json.loads(test_path.read_text()) if test_path.is_file() else {}
completed = rc == '0'
for name in needed:
    result = test.get(name) or {}
    valid = result.get('status') == 'OK' and result.get('total') is not None
    completed = completed and valid
    summary[name] = {k: result[k] for k in ('passed', 'total', 'not_applicable', 'configured_total') if k in result} if valid else {'passed': None, 'total': None}
summary['evaluation_status'] = 'completed' if completed else 'failed'
summary['role'] = 'target'
summary['evaluation_time'] = test.get('evaluation_time')
if isinstance(summary.get('gen_time'), (int, float)) and isinstance(test.get('evaluation_time'), (int, float)):
    summary['total_time'] = summary['gen_time'] + test['evaluation_time']
summary_path.write_text(json.dumps(summary, indent=2) + '\n')
PY
  cleanup_evaluation
  EVAL_ROOT=""

  if [[ -f "$game_output/summary-test.json" ]]; then
    local parsed l1 l2 ok
    parsed=$(python3 - "$game_output/summary-test.json" "$TEST_PHASE" <<'PY'
import json
import sys

path, phase = sys.argv[1], sys.argv[2]
summary = json.load(open(path))

def fmt(name):
    item = summary.get(name) or {}
    status = item.get('status')
    passed = item.get('passed')
    total = item.get('total')
    if status == 'SKIPPED':
        return 'SKIP'
    return f'{passed}/{total}'

def has_result(name):
    item = summary.get(name) or {}
    return item.get('total') is not None

needed = ['l1', 'l2'] if phase == 'all' else [phase]
ok = all(has_result(name) for name in needed)
print(f"{fmt('l1')}\t{fmt('l2')}\t{1 if ok else 0}")
PY
)
    IFS=$'\t' read -r l1 l2 ok <<< "$parsed"
    if [[ "$ok" == "1" && "$rc" -eq 0 ]]; then
      echo "L1=$l1  L2=$l2"
      PASS_COUNT=$((PASS_COUNT + 1))
    else
      echo "FAIL L1=$l1  L2=$l2 (rc=$rc, see $game_output/test.log)"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  else
    echo "FAIL (rc=$rc, see $game_output/test.log)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

for game in "${GAMES[@]}"; do
  run_test "$game"
done

echo ""
echo "═══════════════════════════════════════════════════"
echo " Done | tested=$PASS_COUNT  failed=$FAIL_COUNT  skipped=$SKIP_COUNT"
echo "═══════════════════════════════════════════════════"
[[ "$FAIL_COUNT" -eq 0 ]]
