#!/usr/bin/env bash
# Dump Postgres to a timestamped file. Optionally upload to S3-compatible storage.
#
# Usage:
#   ./scripts/backup-postgres.sh
#   BACKUP_DIR=/var/backups/mailtostory ./scripts/backup-postgres.sh
#
# Optional upload (Backblaze B2, Cloudflare R2, AWS S3):
#   BACKUP_S3_BUCKET=my-bucket
#   BACKUP_S3_ENDPOINT=https://...   # required for R2/B2
#   BACKUP_S3_ACCESS_KEY_ID=...
#   BACKUP_S3_SECRET_ACCESS_KEY=...
#   BACKUP_S3_PREFIX=mailtostory/postgres

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups/postgres}"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
OUT="$BACKUP_DIR/mailtostory-$STAMP.sql.gz"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" | gzip > "$OUT"
echo "Wrote $OUT"

if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI not found; skipping upload." >&2
    exit 0
  fi
  KEY="${BACKUP_S3_PREFIX:-mailtostory/postgres}/$(basename "$OUT")"
  ENDPOINT_ARGS=()
  if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
    ENDPOINT_ARGS=(--endpoint-url "$BACKUP_S3_ENDPOINT")
  fi
  AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY_ID:-}" \
  AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_ACCESS_KEY:-}" \
    aws s3 cp "$OUT" "s3://${BACKUP_S3_BUCKET}/${KEY}" "${ENDPOINT_ARGS[@]}"
  echo "Uploaded s3://${BACKUP_S3_BUCKET}/${KEY}"
fi
