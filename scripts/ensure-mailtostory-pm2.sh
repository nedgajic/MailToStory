#!/usr/bin/env bash
# Ensure PM2 app mailtostory is online. Starts only when missing or unhealthy.

set -euo pipefail

ROOT="${1:-/var/www/mailtostory}"
PM2_APP_NAME="${2:-mailtostory}"

cd "$ROOT" || exit 1

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 not installed — skip ensure."
  exit 0
fi

ECO=""
if [ -f ecosystem.config.cjs ]; then
  ECO="ecosystem.config.cjs"
elif [ -f ecosystem.config.js ]; then
  ECO="ecosystem.config.js"
else
  echo "No ecosystem.config.{cjs,js} in $ROOT"
  exit 1
fi

state() {
  pm2 jlist 2>/dev/null | python3 -c "
import json, sys
name = sys.argv[1]
try:
    for app in json.load(sys.stdin):
        if app.get('name') == name:
            pid = app.get('pid', -1)
            status = (app.get('pm2_env') or {}).get('status', 'unknown')
            print(pid, status)
            raise SystemExit(0)
except Exception:
    pass
print(-1, 'none')
" "$PM2_APP_NAME" 2>/dev/null || echo "-1 none"
}

read -r pid status <<< "$(state)"

need_start=0
if [ "$pid" = "-1" ] || [ "$status" = "none" ] || [ "$pid" = "0" ]; then
  need_start=1
elif [ "$status" = "stopped" ] || [ "$status" = "errored" ] || [ "$status" = "stopping" ]; then
  need_start=1
fi

if [ "$need_start" = 1 ]; then
  echo "mailtostory PM2 absent or unhealthy ($status) — starting..."
  pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
  pm2 start "$ECO" --only "$PM2_APP_NAME" --update-env
  pm2 save
else
  echo "mailtostory PM2 already online (pid=$pid)."
fi
