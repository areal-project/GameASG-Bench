#!/bin/bash
# L2 Runtime Check — 通用主入口
# 用法: run.sh <html-path> --checks <checks.js> [-o report.json] [--duration 30] [--keep-open]
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
HTML=""
DURATION=30
OUTPUT=""
KEEP_OPEN=0
JSON_ONLY=0
ROLE="${L2_ROLE:-original}"
CHECKS="${L2_CHECKS:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output)   OUTPUT="$2"; shift 2 ;;
    --duration)    DURATION="$2"; shift 2 ;;
    --checks)      CHECKS="$2"; shift 2 ;;
    --role)        ROLE="$2"; shift 2 ;;
    --keep-open)   KEEP_OPEN=1; shift ;;
    --json)        JSON_ONLY=1; shift ;;
    -h|--help)
      echo "Usage: $0 <html-path> --checks <checks.js> [-o report.json] [--duration 30] [--role original|target] [--json]"
      exit 0 ;;
    -*)
      echo "Unknown arg: $1" >&2; exit 2 ;;
    *)
      if [[ -z "$HTML" ]]; then HTML="$1"; fi
      shift ;;
  esac
done

if [[ -z "$HTML" ]]; then
  echo "Usage: $0 <html-path> --checks <checks.js> [-o report.json]" >&2
  exit 2
fi
HTML="$(cd "$(dirname "$HTML")" && pwd)/$(basename "$HTML")"

if [[ -z "$CHECKS" && -f "$HERE/checks.js" ]]; then
  CHECKS="$HERE/checks.js"
fi
if [[ -z "$CHECKS" || ! -f "$CHECKS" ]]; then
  echo "ERROR: checks file not found; pass --checks <checks.js>" >&2
  exit 2
fi
CHECKS="$(cd "$(dirname "$CHECKS")" && pwd)/$(basename "$CHECKS")"

# 1. 起 HTTP server
SERVER_INFO=$("$HERE/start-server.sh" "$HTML") || { echo "http server failed" >&2; exit 2; }
SERVER_PID=$(echo "$SERVER_INFO" | cut -d'|' -f1)
PORT=$(echo "$SERVER_INFO" | cut -d'|' -f2)
URL=$(echo "$SERVER_INFO" | cut -d'|' -f3)
SRV_DIR=$(echo "$SERVER_INFO" | cut -d'|' -f4)

cleanup() {
  if [[ "$KEEP_OPEN" -eq 0 ]]; then
    [[ -n "$CHROME_PID" ]] && kill "$CHROME_PID" 2>/dev/null || true
    [[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null || true
    [[ -n "$USER_DATA" && -d "$USER_DATA" ]] && rm -rf "$USER_DATA" 2>/dev/null || true
    [[ -n "$SRV_DIR" && -d "$SRV_DIR" ]] && rm -rf "$SRV_DIR" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# 2. 起 Chrome headless
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$CHROME" ]]; then
  CHROME="$(which google-chrome 2>/dev/null || which chromium 2>/dev/null || echo '')"
  if [[ -z "$CHROME" || ! -x "$CHROME" ]]; then
    echo "ERROR: Chrome not found" >&2
    exit 2
  fi
fi
CDP_PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()")
USER_DATA="${TMPDIR:-/tmp}/l2-chrome-$$"

"$CHROME" --headless=new \
  --no-sandbox --disable-dev-shm-usage \
  --no-first-run --no-default-browser-check \
  --disable-features=TranslateUI,CalculateNativeWinOcclusion \
  --disable-renderer-backgrounding \
  --disable-backgrounding-occluded-windows \
  --disable-background-timer-throttling \
  --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader \
  --enable-webgl --ignore-gpu-blocklist \
  --remote-debugging-port="$CDP_PORT" \
  --user-data-dir="$USER_DATA" \
  --window-size=1280,800 \
  about:blank > "$USER_DATA.log" 2>&1 &
CHROME_PID=$!

for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  if curl -s "http://localhost:$CDP_PORT/json/version" > /dev/null 2>&1; then break; fi
  sleep 0.25
done

if ! curl -s "http://localhost:$CDP_PORT/json/version" > /dev/null 2>&1; then
  echo "ERROR: Chrome CDP did not come up on port $CDP_PORT" >&2
  tail -30 "$USER_DATA.log" >&2 || true
  exit 2
fi

# 3. 跑 run.js
ARGS=("--url" "$URL" "--cdp-port" "$CDP_PORT" "--duration" "$DURATION" "--role" "$ROLE" "--checks" "$CHECKS")
[[ -n "$OUTPUT" ]] && ARGS+=("-o" "$OUTPUT")
[[ "$JSON_ONLY" -eq 1 ]] && ARGS+=("--json")

EXIT=0
node "$HERE/run.js" "${ARGS[@]}" || EXIT=$?
exit $EXIT
