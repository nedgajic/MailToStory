#!/usr/bin/env bash
# Deploy MailToStory to Hostinger VPS via rsync + remote build.
#
# Usage:
#   ./deploy.sh                 # sync, build on server, reload PM2
#   ./deploy.sh --dry-run       # show what would sync
#   ./deploy.sh --sync-only     # rsync only (no build / PM2)
#   ./deploy.sh --no-restart    # build but skip PM2 reload (post-deploy still runs)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DRY_RUN=0
SYNC_ONLY=0
NO_RESTART=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --sync-only) SYNC_ONLY=1 ;;
    --no-restart) NO_RESTART=1 ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      echo "Usage: ./deploy.sh [--dry-run] [--sync-only] [--no-restart]"
      exit 1
      ;;
  esac
done

if [ ! -f ".deploy.config" ]; then
  echo -e "${RED}.deploy.config not found.${NC}"
  echo "Copy .deploy.config.example to .deploy.config and set HOST, USER, REMOTE_DIR."
  exit 1
fi

# shellcheck disable=SC1091
source .deploy.config

if [ -z "${HOST:-}" ] || [ -z "${USER:-}" ] || [ -z "${REMOTE_DIR:-}" ]; then
  echo -e "${RED}Missing HOST, USER, or REMOTE_DIR in .deploy.config${NC}"
  exit 1
fi

PORT="${PORT:-22}"
PM2_APP_NAME="${PM2_APP_NAME:-mailtostory}"

if [ -z "${RSYNC:-}" ]; then
  RSYNC="rsync"
  for candidate in /opt/homebrew/bin/rsync /usr/local/opt/rsync/bin/rsync /usr/local/bin/rsync; do
    if [ -x "$candidate" ]; then
      RSYNC="$candidate"
      break
    fi
  done
fi

if ! "$RSYNC" --version >/dev/null 2>&1; then
  echo -e "${RED}rsync not found (RSYNC=$RSYNC)${NC}"
  exit 1
fi

EXCLUDE_FILE="$(mktemp)"
trap 'rm -f "$EXCLUDE_FILE"' EXIT

if [ -f ".deployignore" ]; then
  grep -v '^#' .deployignore | grep -v '^$' | sed 's|^|--exclude=|' > "$EXCLUDE_FILE"
fi

RSYNC_FLAGS=(-avz --progress --delete --exclude-from="$EXCLUDE_FILE" --exclude='.env' --exclude='.env.*' --exclude='node_modules/' --exclude='.next/' --exclude='out/')
if [ "$DRY_RUN" = 1 ]; then
  RSYNC_FLAGS+=(--dry-run)
  echo -e "${YELLOW}DRY RUN — no files uploaded, no remote build${NC}"
fi

echo -e "${GREEN}Deploying MailToStory to Hostinger${NC}"
echo "Host: $HOST"
echo "User: $USER"
echo "Remote: $REMOTE_DIR"
echo "Rsync: $RSYNC ($("$RSYNC" --version 2>&1 | head -1))"
echo ""

echo -e "${YELLOW}Testing SSH...${NC}"
ssh -p "$PORT" "$USER@$HOST" "mkdir -p '$REMOTE_DIR'" || {
  echo -e "${RED}SSH connection failed.${NC}"
  exit 1
}

if [ "$DRY_RUN" = 0 ]; then
  echo -e "${YELLOW}Backing up remote .env (if present)...${NC}"
  ssh -p "$PORT" "$USER@$HOST" "
    if [ -f '$REMOTE_DIR/.env' ]; then
      cp '$REMOTE_DIR/.env' '$REMOTE_DIR/.env.backup.\$(date +%Y%m%d_%H%M%S)'
    fi
  " 2>/dev/null || true
fi

echo -e "${YELLOW}Syncing files...${NC}"
"$RSYNC" "${RSYNC_FLAGS[@]}" -e "ssh -p $PORT" ./ "$USER@$HOST:$REMOTE_DIR/"

if [ "$DRY_RUN" = 1 ]; then
  echo -e "${YELLOW}Dry run done. Run without --dry-run to deploy.${NC}"
  exit 0
fi

echo -e "${GREEN}Sync complete.${NC}"

if [ "$SYNC_ONLY" = 1 ]; then
  echo -e "${YELLOW}--sync-only: skipping remote build and PM2.${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}Running post-deploy on server (install, migrate, build)...${NC}"
scp -P "$PORT" scripts/post-deploy.sh "$USER@$HOST:/tmp/mailtostory-post-deploy.sh"
if [ "$NO_RESTART" = 1 ]; then
  ssh -p "$PORT" "$USER@$HOST" "chmod +x /tmp/mailtostory-post-deploy.sh && SKIP_PM2=1 bash /tmp/mailtostory-post-deploy.sh '$REMOTE_DIR' '$PM2_APP_NAME'"
else
  ssh -p "$PORT" "$USER@$HOST" "chmod +x /tmp/mailtostory-post-deploy.sh && bash /tmp/mailtostory-post-deploy.sh '$REMOTE_DIR' '$PM2_APP_NAME'"
fi

echo ""
echo -e "${YELLOW}Ensuring PM2 app is healthy...${NC}"
scp -P "$PORT" scripts/ensure-mailtostory-pm2.sh "$USER@$HOST:/tmp/ensure-mailtostory-pm2.sh" 2>/dev/null || true
ssh -p "$PORT" "$USER@$HOST" "chmod +x /tmp/ensure-mailtostory-pm2.sh && bash /tmp/ensure-mailtostory-pm2.sh '$REMOTE_DIR' '$PM2_APP_NAME'" || true

echo ""
echo -e "${GREEN}Deployment finished.${NC}"
echo -e "${GREEN}Production .env was not overwritten.${NC}"
echo ""
echo "Next checks:"
echo "  ssh -p $PORT $USER@$HOST"
echo "  cd $REMOTE_DIR && pm2 logs $PM2_APP_NAME"
echo "  curl -I http://127.0.0.1:\${PORT:-3000}"
