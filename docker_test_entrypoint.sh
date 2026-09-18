#!/bin/bash
set -euo pipefail

GAME="${GAME:?ERROR: GAME env var required}"
L2_DURATION="${L2_DURATION:-30}"
TEST_PHASE="${TEST_PHASE:-all}"
EVALUATION_ROLE="target"
START_TIME=$(date +%s)

case "$TEST_PHASE" in
  all) RUN_L1=1; RUN_L2=1 ;;
  l1)  RUN_L1=1; RUN_L2=0 ;;
  l2)  RUN_L1=0; RUN_L2=1 ;;
  *)   echo "ERROR: unknown TEST_PHASE: $TEST_PHASE (expected: all|l1|l2)" >&2; exit 2 ;;
esac

ENVARENA_DIR="${ENVARENA_DIR:-/envarena}"
TESTS_DIR="$ENVARENA_DIR/tests"
SCRIPTS_DIR="$ENVARENA_DIR/scripts"
OUTPUT_DIR="$ENVARENA_DIR/reports"
INPUT_DIR="$ENVARENA_DIR/input"

GAME_TESTS_DIR="$TESTS_DIR/$GAME"
CHECKS_JSON="$GAME_TESTS_DIR/checks.json"
CHECKS_JS="$GAME_TESTS_DIR/checks.js"
L2_RUN_SH="$SCRIPTS_DIR/l2/run.sh"

HTML_FILE="$INPUT_DIR/index.html"

[[ -f "$HTML_FILE" && ! -L "$HTML_FILE" ]] || { echo "ERROR: regular index.html not found: $HTML_FILE" >&2; exit 2; }
[[ -d "$GAME_TESTS_DIR" ]] || { echo "ERROR: tests dir not found: $GAME_TESTS_DIR" >&2; exit 2; }

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }
log() { echo "$(timestamp) | $1"; }

log "Test-only mode | game=$GAME | phase=$TEST_PHASE | role=$EVALUATION_ROLE"

L1_REPORT="$OUTPUT_DIR/report-l1.json"
L1_PASS="SKIP"
L1_TOTAL="SKIP"
L1_STATUS="SKIPPED"

if [[ $RUN_L1 -eq 1 ]]; then
  log "L1 static checks..."
  rm -f "$L1_REPORT"
  L1_PASS="N/A"
  L1_TOTAL="N/A"
  L1_STATUS="NO_RESULT"

  if [[ -f "$CHECKS_JSON" ]]; then
    python3 "$SCRIPTS_DIR/l1/run_l1.py" "$HTML_FILE" \
      --checks "$CHECKS_JSON" \
      -o "$L1_REPORT" --json 2>/dev/null || true

    if [[ -f "$L1_REPORT" ]]; then
      L1_TOTAL=$(python3 -c "import json; r=json.load(open('$L1_REPORT')); print(len([c for c in r.get('tool_checks',[])+r.get('checks',[])+r.get('anti_patterns',[])+r.get('proximity_checks',[])]))" 2>/dev/null || echo "?")
      L1_PASS=$(python3 -c "import json; r=json.load(open('$L1_REPORT')); print(len([c for c in r.get('tool_checks',[])+r.get('checks',[])+r.get('anti_patterns',[])+r.get('proximity_checks',[]) if c.get('status')=='PASS']))" 2>/dev/null || echo "?")
      L1_STATUS="OK"
      log "  L1: ${L1_PASS}/${L1_TOTAL}"
    fi
  else
    log "  L1: checks.json not found"
  fi
else
  log "L1 static checks: skipped"
fi

L2_REPORT="$OUTPUT_DIR/report-l2.json"
L2_STDERR="$OUTPUT_DIR/l2-stderr.log"
L2_PASS="SKIP"
L2_TOTAL="SKIP"
L2_NOT_APPLICABLE="SKIP"
L2_CONFIGURED_TOTAL="SKIP"
L2_STATUS="SKIPPED"
L2_EXIT=""

if [[ $RUN_L2 -eq 1 ]]; then
  log "L2 runtime checks..."
  rm -f "$L2_REPORT" "$L2_STDERR"
  L2_PASS="N/A"
  L2_TOTAL="N/A"
  L2_NOT_APPLICABLE="N/A"
  L2_CONFIGURED_TOTAL="N/A"
  L2_STATUS="NO_RESULT"

  if [[ -f "$L2_RUN_SH" && -f "$CHECKS_JS" ]]; then
    mkdir -p /tmp/node_modules
    GLOBAL_NODE_MODULES="$(npm root -g 2>/dev/null || true)"
    export NODE_PATH="/tmp/node_modules${GLOBAL_NODE_MODULES:+:$GLOBAL_NODE_MODULES}"
    if ! node -e "require('ws')" >/dev/null 2>&1; then
      cd /tmp && npm install ws --silent 2>/dev/null || true
    fi
    cd "$OUTPUT_DIR"

    set +e
    bash "$L2_RUN_SH" "$HTML_FILE" \
      --checks "$CHECKS_JS" \
      --duration "$L2_DURATION" \
      --role "$EVALUATION_ROLE" \
      -o "$L2_REPORT" \
      > "$L2_STDERR" 2>&1
    L2_EXIT=$?
    set -e

    if [[ -f "$L2_REPORT" ]]; then
      L2_TOTAL=$(python3 -c "import json; r=json.load(open('$L2_REPORT')); s=r.get('summary',{}); print(s.get('applicable_total', len([c for c in r.get('checks',[]) if c.get('status') != 'NOT_APPLICABLE'])))" 2>/dev/null || echo "?")
      L2_PASS=$(python3 -c "import json; r=json.load(open('$L2_REPORT')); print(len([c for c in r.get('checks',[]) if c.get('status')=='PASS']))" 2>/dev/null || echo "?")
      L2_NOT_APPLICABLE=$(python3 -c "import json; r=json.load(open('$L2_REPORT')); s=r.get('summary',{}); print(s.get('not_applicable', len([c for c in r.get('checks',[]) if c.get('status') == 'NOT_APPLICABLE'])))" 2>/dev/null || echo "?")
      L2_CONFIGURED_TOTAL=$(python3 -c "import json; r=json.load(open('$L2_REPORT')); s=r.get('summary',{}); print(s.get('configured_total', len(r.get('checks',[]))))" 2>/dev/null || echo "?")
      L2_STATUS="OK"
      log "  L2: ${L2_PASS}/${L2_TOTAL} applicable (${L2_NOT_APPLICABLE} not applicable)"
    elif [[ -n "$L2_EXIT" ]]; then
      log "  L2: no report generated (runner exit=$L2_EXIT, see l2-stderr.log)"
    fi
  else
    log "  L2: common run.sh or game checks.js not found"
  fi
else
  log "L2 runtime checks: skipped"
fi

SUMMARY_TEST_FILE="$OUTPUT_DIR/summary-test.json"
EVALUATION_TIME=$(( $(date +%s) - START_TIME ))

python3 -c "
import json

def to_int(v):
    try:
        return int(v)
    except (ValueError, TypeError):
        return None

summary = {
    'game': '$GAME',
    'mode': 'test-only',
    'test_phase': '$TEST_PHASE',
    'role': '$EVALUATION_ROLE',
    'evaluation_time': $EVALUATION_TIME,
    'l1': {'passed': to_int('$L1_PASS'), 'total': to_int('$L1_TOTAL'), 'status': '$L1_STATUS'},
    'l2': {
        'passed': to_int('$L2_PASS'),
        'total': to_int('$L2_TOTAL'),
        'not_applicable': to_int('$L2_NOT_APPLICABLE'),
        'configured_total': to_int('$L2_CONFIGURED_TOTAL'),
        'status': '$L2_STATUS',
    },
}
for phase in ('l1', 'l2'):
    item = summary[phase]
    if item['status'] == 'SKIPPED':
        continue
    try:
        with open('$OUTPUT_DIR/report-' + phase + '.json') as f:
            report = json.load(f)
        valid = not report.get('error') and item['total'] is not None
        if phase == 'l1':
            valid = valid and item['total'] > 0
        else:
            valid = valid and '$L2_EXIT' in ('0', '1') and isinstance(report.get('checks'), list) and bool(report['checks'])
    except (OSError, ValueError, TypeError):
        valid = False
    if not valid:
        item.update(status='ERROR', passed=None, total=None)
with open('$SUMMARY_TEST_FILE', 'w') as f:
    json.dump(summary, f, indent=2)
"

log "Completed | L1=${L1_PASS}/${L1_TOTAL} L2=${L2_PASS}/${L2_TOTAL}"
python3 - "$SUMMARY_TEST_FILE" <<'PY_STATUS'
import json
import sys
with open(sys.argv[1]) as f:
    summary = json.load(f)
needed = ('l1', 'l2') if summary['test_phase'] == 'all' else (summary['test_phase'],)
sys.exit(0 if all(summary[name]['status'] == 'OK' for name in needed) else 2)
PY_STATUS
