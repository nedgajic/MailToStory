#!/usr/bin/env bash
# Archive inbound uploads. Optionally upload to S3-compatible storage.
#
# Usage:
#   ./scripts/backup-uploads.sh
#   BACKUP_DIR=/var/backups/mailtostory ./scripts/backup-uploads.sh
#
# Optional upload env vars: same as scripts/backup-postgres.sh (BACKUP_S3_*)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups/uploads}"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

UPLOAD_DIR="${INBOUND_UPLOAD_DIR:-$ROOT/uploads}"
if [ ! -d "$UPLOAD_DIR" ]; then
  echo "Upload dir not found: $UPLOAD_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/uploads-$STAMP.tar.gz"
tar -czf "$OUT" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
echo "Wrote $OUT"

if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI not found; skipping upload." >&2
    exit 0
  fi
  KEY="${BACKUP_S3_PREFIX:-mailtostory/uploads}/$(basename "$OUT")"
  ENDPOINT_ARGS=()
  if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
    ENDPOINT_ARGS=(--endpoint-url "$BACKUP_S3_ENDPOINT")
  fi
  AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY_ID:-}" \
  AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_ACCESS_KEY:-}" \
    aws s3 cp "$OUT" "s3://${BACKUP_S3_BUCKET}/${KEY}" "${ENDPOINT_ARGS[@]}"
  echo "Uploaded s3://${BACKUP_S3_BUCKET}/${KEY}"
fi
