#!/usr/bin/env bash
# One-time bootstrap for /var/www/mailtostory on the shared dt-wellness VPS.
# Usage: npm run deploy:bootstrap

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f ".deploy.config" ]; then
  echo -e "${RED}.deploy.config not found. Copy .deploy.config.example first.${NC}"
  exit 1
fi

# shellcheck disable=SC1091
source .deploy.config

PORT="${PORT:-22}"
APP_PORT="${APP_PORT:-3010}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/mailtostory}"

echo -e "${GREEN}Bootstrapping MailToStory on $USER@$HOST${NC}"
echo "Remote dir: $REMOTE_DIR"
echo "App port: $APP_PORT"
echo ""

ssh -p "$PORT" "$USER@$HOST" bash -s <<EOF
set -euo pipefail
mkdir -p "$REMOTE_DIR/logs"
if [ ! -f "$REMOTE_DIR/.env" ]; then
  echo "No .env yet — will create from .env.example on first deploy."
fi
echo "Directory ready: $REMOTE_DIR"
pm2 -v >/dev/null 2>&1 && echo "PM2: \$(pm2 -v)" || echo "WARN: PM2 not installed (npm install -g pm2)"
node -v 2>/dev/null || echo "WARN: Node not found"
EOF

echo ""
echo -e "${YELLOW}PostgreSQL (same VPS as dt-wellness) — create DB once if needed:${NC}"
echo "  ssh -p $PORT $USER@$HOST"
echo "  sudo -u postgres psql -c \"CREATE USER mailtostory WITH PASSWORD 'CHOOSE_STRONG_PASSWORD';\" || true"
echo "  sudo -u postgres psql -c \"CREATE DATABASE mailtostory OWNER mailtostory;\" || true"
echo ""
echo -e "${YELLOW}Production .env on server ($REMOTE_DIR/.env):${NC}"
echo "  PORT=$APP_PORT"
echo "  NEXTAUTH_URL=https://mailtostory.com"
echo "  DATABASE_URL=postgresql://mailtostory:PASSWORD@localhost:5432/mailtostory?schema=public"
echo ""
echo -e "${YELLOW}Nginx:${NC} see docs/nginx-mailtostory.conf.example (proxies to 127.0.0.1:$APP_PORT)"
echo ""
echo -e "${GREEN}Bootstrap check done. Next: npm run deploy${NC}"
