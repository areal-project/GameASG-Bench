#!/bin/bash
# 起临时 HTTP server 服务给定 HTML 文件
# 输出: PID|PORT|URL|TMPDIR
set -e

HTML="$1"
if [[ -z "$HTML" || ! -f "$HTML" ]]; then
  echo "ERROR: html file not found: $HTML" >&2
  exit 2
fi

TMPBASE="${TMPDIR:-/tmp}/l2-srv-$$"
mkdir -p "$TMPBASE"
SRC_DIR="$(cd "$(dirname "$HTML")" && pwd)"
cp -R "$SRC_DIR"/. "$TMPBASE"/
if [[ "$(basename "$HTML")" != "index.html" ]]; then
  cp "$HTML" "$TMPBASE/index.html"
fi

PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()")

cd "$TMPBASE"
python3 -m http.server "$PORT" > "$TMPBASE/server.log" 2>&1 &
SERVER_PID=$!

for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s "http://localhost:$PORT/index.html" -o /dev/null; then break; fi
  sleep 0.1
done

echo "$SERVER_PID|$PORT|http://localhost:$PORT/index.html|$TMPBASE"
