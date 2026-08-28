# Deploy MailToStory to Hostinger VPS (shared with dt-wellness)

Same VPS as **dt-wellness** (`31.97.77.179`, `/var/www/dt-wellness`). MailToStory lives in **`/var/www/mailtostory`** on its own port so PM2 apps do not clash.

## Port map (same VPS)

| App | PM2 name | Port |
|-----|----------|------|
| dt-wellness | `dt-wellness` | 5173 |
| Strapi | `strapi` | 1337 |
| Medusa | `medusajs` | 9000 |
| **MailToStory** | `mailtostory` | **3010** |

Nginx terminates HTTPS for `mailtostory.com` and proxies to `127.0.0.1:3010`.

## Local setup (done)

`.deploy.config` is pre-filled for the shared server:

```bash
HOST="31.97.77.179"
USER="root"
REMOTE_DIR="/var/www/mailtostory"
APP_PORT="3010"
```

## One-time server steps

```bash
# From mailtostory repo on your Mac
npm run deploy:bootstrap
```

Then SSH in:

```bash
ssh root@31.97.77.179

# Postgres DB (reuse same Postgres as dt-wellness)
sudo -u postgres psql -c "CREATE USER mailtostory WITH PASSWORD 'CHOOSE_STRONG_PASSWORD';" || true
sudo -u postgres psql -c "CREATE DATABASE mailtostory OWNER mailtostory;" || true

cd /var/www/mailtostory
cp .env.example .env   # after first deploy sync, or create manually
nano .env
```

Production `.env` essentials:

```env
PORT=3010
NEXTAUTH_URL=https://mailtostory.com
NEXTAUTH_SECRET="..."   # openssl rand -base64 32
DATABASE_URL="postgresql://mailtostory:PASSWORD@localhost:5432/mailtostory?schema=public"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GEMINI_API_KEY="..."
NODE_ENV=production
```

Google OAuth redirect: `https://mailtostory.com/api/auth/callback/google`

### Nginx

Copy the example config (includes security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS):

```bash
sudo cp /var/www/mailtostory/docs/nginx-mailtostory.conf.example /etc/nginx/sites-available/mailtostory
sudo ln -sf /etc/nginx/sites-available/mailtostory /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mailtostory.com -d www.mailtostory.com
```

## Deploy

```bash
npm run deploy:dry-run
npm run deploy
```

This syncs code, runs `prisma migrate deploy`, builds Next.js, and `pm2 reload mailtostory`. **dt-wellness / Strapi / Medusa are not touched.**

## Verify

```bash
ssh root@31.97.77.179
pm2 status
curl -I http://127.0.0.1:3010
pm2 logs mailtostory --lines 50
```

## Troubleshooting

- **502 from nginx** — `pm2 status` → is `mailtostory` online? Is `PORT=3010` in `/var/www/mailtostory/.env`?
- **OAuth redirect mismatch** — `NEXTAUTH_URL` must be `https://mailtostory.com` (not localhost).
- **DB connection** — use `localhost:5432` on VPS; database name `mailtostory` (separate from `dt_wellness`).

## MailToStory (Postmark + Stripe)

Add to production `.env` (see `.env.example`):

- `POSTMARK_INBOUND_DOMAIN=inbox.mailtostory.com`
- `POSTMARK_INBOUND_BASIC_USER` / `POSTMARK_INBOUND_BASIC_PASSWORD` — match Postmark inbound webhook Basic auth
- `POSTMARK_SERVER_TOKEN` / `POSTMARK_FROM_EMAIL` — outbound verify/reset/invite/**story-ready** emails (HTML via React Email)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_TEAM`, `STRIPE_PRICE_TEAM_ANNUAL`

DNS: MX for **`inbox.mailtostory.com` only** → Postmark Inbound. Keep `mailtostory.com` A record for the site. Verify **sender domain** (`mailtostory.com`) in Postmark for outbound mail from `noreply@mailtostory.com`.

**Story-ready emails:** After inbound processing generates a story, MailToStory sends a React Email HTML message through Postmark with a 7-day magic link (`/api/story-access?token=…`) that signs the recipient in and opens the story. On Team plans, each member toggles this under **Settings → Profile**; on Free/Pro, only the account email that forwarded the thread is notified (if enabled).

Webhooks:

- Postmark inbound: `https://mailtostory.com/api/inbound/postmark`
- Stripe: `https://mailtostory.com/api/stripe/webhook`

## Operations (health, cron, backups)

### Health check

UptimeRobot (or similar) should ping:

```text
GET https://mailtostory.com/api/health
```

Returns `{ "ok": true, "version": "0.1.0", "db": "ok" }` when Postgres is reachable. No auth required.

### Maintenance cron

Generate a secret once:

```bash
openssl rand -base64 32
```

Add to production `.env`:

```env
CRON_SECRET="..."
ADMIN_EMAILS="nedgajic@gmail.com"
# SENTRY_DSN="https://...@sentry.io/..."   # optional
```

Daily maintenance (quarantine cleanup, expired story-access tokens, generation logs older than 90 days):

```bash
crontab -e
# Daily 04:15 UTC
15 4 * * * curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" https://mailtostory.com/api/cron/maintenance >/dev/null
```

Legacy endpoint `/api/cron/quarantine-cleanup` still works but only deletes expired quarantine rows. Prefer `/api/cron/maintenance`.

### Backups

On the VPS (requires `pg_dump`, `tar`, optional `aws` CLI for S3/R2/B2):

```bash
cd /var/www/mailtostory
chmod +x scripts/backup-postgres.sh scripts/backup-uploads.sh
./scripts/backup-postgres.sh
./scripts/backup-uploads.sh
```

Optional off-site upload — set `BACKUP_S3_*` in `.env` (see `.env.example`), then schedule:

```bash
# Daily 03:00 UTC
0 3 * * * cd /var/www/mailtostory && ./scripts/backup-postgres.sh && ./scripts/backup-uploads.sh
```

**Restore Postgres:** `gunzip -c backups/postgres/mailtostory-*.sql.gz | psql "$DATABASE_URL"`

**Restore uploads:** extract the tarball over `INBOUND_UPLOAD_DIR` (default `./uploads`).

### Attachment storage (optional Cloudflare R2)

By default, inbound attachments are stored on the VPS under `INBOUND_UPLOAD_DIR` (default `./uploads`). When R2 is configured, **new** attachments go to R2 automatically; existing local files keep working until you migrate them.

```env
ATTACHMENT_STORAGE="auto"   # auto | local | r2
R2_BUCKET="mailtostory-attachments"
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_PREFIX="attachments"
```

If any `R2_*` value is missing, the app falls back to local disk with no downtime.

### Attachment malware scanning (optional, free)

Every inbound attachment is checked against a built-in blocklist of executable file types (always on, no extra cost).

Optional **ClamAV** daemon scanning (free open-source antivirus if you install `clamav` on the VPS):

```bash
sudo apt install clamav clamav-daemon
sudo systemctl enable --now clamav-daemon
```

```env
CLAMAV_HOST="127.0.0.1"
CLAMAV_PORT="3310"
```

If ClamAV is unreachable, the app still stores attachments that pass the blocklist.

### Two-factor authentication

Users with email/password can enable TOTP in **Settings → Profile**. Google sign-in is unchanged. Optional dedicated encryption key:

```env
TWO_FACTOR_ENCRYPTION_KEY="..."   # defaults to NEXTAUTH_SECRET
```

Run the new migration after deploy:

```bash
npx prisma migrate deploy
```

### Help center

Public docs live at `/help` (linked from the footer and app menu). No extra configuration required.

## Production Gemini setup

Story generation uses the [Gemini API](https://ai.google.dev/gemini-api/docs/pricing) (pay-as-you-go). There is no separate “Gemini subscription” — attach a **billing account** to your Google Cloud / AI Studio project and pay per token.

### Enable billing (leave the free tier for dev)

1. Open [Google AI Studio](https://aistudio.google.com/) → your project → **Settings** → enable billing (moves you to **Tier 1** pay-as-you-go).
2. Confirm rate limits under **Settings → Rate limits** (quotas vary slightly per project).
3. Set a **GCP billing alert** (e.g. $100/month) — at ~$0.01/story that is ~10,000 stories of headroom.

**Why not free tier in production:** ~10 RPM / ~250 RPD, 429 errors under load, and Google may use free-tier prompts to improve products. Paid tier disables training use on API data.

**When to upgrade to Tier 2:** consistently near **~1,500 stories/day** on one project, or frequent 429s during email bursts. Tier 2 raises daily caps (~10,000 RPD). See [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

### Recommended model

Keep the app default — **`gemini-2.5-flash`**. Best quality/cost for email summarization. Do **not** switch to Gemini Pro for this workload (~4× more expensive, no meaningful gain for structured digests).

Fallback chain (automatic when primary model/key is rate-limited): `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.0-flash-lite`.

### Production `.env`

```env
GEMINI_API_KEY="..."                    # primary key from AI Studio
# GEMINI_API_KEY_FALLBACKS="key2,key3"  # optional second project if you hit rate limits
GEMINI_MODEL="gemini-2.5-flash"
# GEMINI_MODEL_FALLBACKS="gemini-2.5-flash-lite"
# GEMINI_MAX_OUTPUT_TOKENS=16384        # default; lower to 8192 if stories never truncate
```

App-side caps (independent of Gemini quotas) — defaults in `src/lib/billing/plans.ts`:

| Plan | Limit |
|------|-------|
| Free | 5 stories / workspace / month |
| Pro | 500 generations / month (fair use) |
| Team | 500 / seat / month |
| All plans | 30 / hour, 200 / day per workspace |

Override via `GENERATION_LIMIT_*` env vars (see `.env.example`).

### Cost per story (average thread)

Typical forwarded thread: ~5 messages, ~200 words each after quote-stripping.

| Component | Tokens (est.) |
|-----------|---------------|
| System + prompt template | ~850 |
| Thread body | ~2,000–3,000 |
| JSON output (story, timeline, actions) | ~2,500–4,000 |

**`gemini-2.5-flash` paid pricing:** $0.30/M input, $2.50/M output.

| Thread size | Cost / story |
|-------------|--------------|
| Short (2–3 messages) | ~$0.006 |
| **Average (~5 messages)** | **~$0.01** |
| Long (10+ messages) | ~$0.015 |

Budget **~$0.01 per story** for planning. Fallback to `gemini-2.5-flash-lite` is ~$0.002/story if quality is acceptable.

### Gemini capacity (Tier 1, single project)

| Constraint | Approx. limit | Stories / month |
|------------|---------------|-----------------|
| Requests / day (RPD) | ~1,500 | ~45,000 |
| Requests / minute (RPM) | ~300 | burst only |
| Tokens / minute (TPM) | ~2M | ~285 avg stories/min |

Tier 1 handles tens of thousands of stories/month on one key. Your app fair-use caps bind before Gemini limits in normal operation.

### Scaling cost estimates

Assumptions: free users ~3 of 5 stories/month; paid users ~25 stories/month; $0.01/story on Flash.

| Users | Mix | Realistic stories/mo | Gemini cost/mo | Notes |
|-------|-----|----------------------|----------------|-------|
| 500 | 350 free + 150 paid | ~4,800 | **~$48** | Tier 1 is plenty |
| 1,500 | 1,000 free + 500 paid | ~15,500 | **~$155** | Tier 1; watch daily peaks |

**Worst case** (every user hits app caps: free × 5, paid × 500):

| Users | Stories / mo | Gemini cost / mo |
|-------|--------------|------------------|
| 500 | ~76,750 | ~$768 |
| 1,500 | ~255,000 | ~$2,550 |

At realistic usage, Gemini is roughly **1–3% of subscription revenue**. The 500/month paid cap protects margins even if usage spikes.

### Troubleshooting Gemini

- **429 / quota exceeded** — enable billing; check AI Studio rate limits; add `GEMINI_API_KEY_FALLBACKS` from a second project; request Tier 2 if daily volume exceeds ~1,500.
- **503 / high demand** — app retries across model fallbacks automatically; transient spikes usually clear in minutes.
- **Story cut off** — raise `GEMINI_MAX_OUTPUT_TOKENS` or forward a shorter thread.
- **Empty / invalid JSON** — check `pm2 logs mailtostory` for `[gemini]` lines; verify the key has Generative Language API access.
