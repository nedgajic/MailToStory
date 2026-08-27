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

## Thread Drop (Postmark + Stripe)

Add to production `.env` (see `.env.example`):

- `POSTMARK_INBOUND_DOMAIN=inbox.mailtostory.com`
- `POSTMARK_INBOUND_BASIC_USER` / `POSTMARK_INBOUND_BASIC_PASSWORD` — match Postmark inbound webhook Basic auth
- `POSTMARK_SERVER_TOKEN` / `POSTMARK_FROM_EMAIL` — outbound verify/reset/invite
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`

DNS: MX for **`inbox.mailtostory.com` only** → Postmark Inbound. Keep `mailtostory.com` A record for the site.

Webhooks:

- Postmark inbound: `https://mailtostory.com/api/inbound/postmark`
- Stripe: `https://mailtostory.com/api/stripe/webhook`
