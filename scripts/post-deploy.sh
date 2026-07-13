#!/usr/bin/env bash
# Run on the VPS after rsync deploy: install, migrate DB, build Next.js, reload PM2.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="${1:-/var/www/mailtostory}"
PM2_APP_NAME="${2:-mailtostory}"

echo -e "${GREEN}MailToStory post-deploy${NC}"
echo "Directory: $APP_DIR"
echo ""

cd "$APP_DIR" || {
  echo -e "${RED}Directory not found: $APP_DIR${NC}"
  exit 1
}

if [ ! -f ".env" ]; then
  echo -e "${RED}.env missing on server. Create it before deploying:${NC}"
  echo "  cp .env.example .env && nano .env"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}Node.js not found on server.${NC}"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo -e "${RED}Node 20+ required (found $(node -v)).${NC}"
  exit 1
fi

mkdir -p logs

echo -e "${YELLOW}Installing dependencies (npm ci)...${NC}"
npm ci

echo -e "${YELLOW}Prisma generate + migrate deploy...${NC}"
npx prisma generate
npx prisma migrate deploy

echo -e "${YELLOW}Building Next.js (npm run build)...${NC}"
npm run build

echo -e "${YELLOW}Pruning devDependencies...${NC}"
npm prune --omit=dev

if [ "${SKIP_PM2:-}" = "1" ]; then
  echo -e "${YELLOW}SKIP_PM2=1 — build done, PM2 reload skipped.${NC}"
  exit 0
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo -e "${YELLOW}PM2 not installed. Install globally: npm install -g pm2${NC}"
  echo -e "${GREEN}Build finished. Start manually: npm start${NC}"
  exit 0
fi

ECO=""
if [ -f ecosystem.config.cjs ]; then
  ECO="ecosystem.config.cjs"
elif [ -f ecosystem.config.js ]; then
  ECO="ecosystem.config.js"
fi

if [ -n "$ECO" ]; then
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}Reloading PM2 app: $PM2_APP_NAME${NC}"
    pm2 reload "$ECO" --only "$PM2_APP_NAME" --update-env
  else
    echo -e "${YELLOW}Starting PM2 app: $PM2_APP_NAME${NC}"
    pm2 start "$ECO" --only "$PM2_APP_NAME" --update-env
  fi
  pm2 save
else
  echo -e "${YELLOW}No ecosystem config — restarting by name${NC}"
  pm2 restart "$PM2_APP_NAME" --update-env || pm2 start npm --name "$PM2_APP_NAME" -- start
fi

echo ""
echo -e "${GREEN}Post-deploy complete.${NC}"
pm2 status "$PM2_APP_NAME" 2>/dev/null || true
