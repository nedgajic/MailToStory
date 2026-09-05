# Launch configuration guide

Step-by-step setup so MailToStory can go live and accept real users. Server install, Nginx, and `pm2` live in **[DEPLOYMENT.md](DEPLOYMENT.md)**. This document is everything you configure **outside the repo**: accounts, DNS, API keys, and the production `.env`.

**Production VPS is already running** (`31.97.77.179`, `/var/www/mailtostory`, PM2 `mailtostory` on port **3010**). If you only need to ship new code, skip to **[Update app only](#update-app-only)** below. Use the rest of this doc when adding or verifying Postmark, Stripe, cron, and any missing `.env` keys.

---

## Production status (checked 2026-09-05)

| Item | Status |
|------|--------|
| DNS A records (`@`, `www` → `31.97.77.179`) | Done — site loads |
| Nginx + Let's Encrypt (`mailtostory.com`, `www`) | Done |
| Postgres database `mailtostory` | Done |
| PM2 app `mailtostory` on port 3010 | Online |
| Production `.env` (core) | `DATABASE_URL`, `NEXTAUTH_*`, `GOOGLE_*`, `GEMINI_API_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Google Analytics (`G-P43B4NBGRL`) | Configured |
| Last app deploy on server | **2026-08-02** — behind current repo |
| Postmark (inbound + outbound) | **Not in `.env` yet** — forwarding & transactional mail need setup (sections 4, 4c) |
| Stripe (checkout + webhook) | **Not in `.env` yet** — paid plans need setup (section 5) |
| `CRON_SECRET` + maintenance cron | **Not configured** — section 7 |
| `ADMIN_EMAILS` | **Not configured** |
| `/api/health` | Available after next deploy (not in the Aug 2026 build) |

---

## Update app only

From your Mac in the mailtostory repo (`.deploy.config` should already point at the VPS):

```bash
npm run deploy:dry-run   # optional — preview rsync
npm run deploy
```

This syncs code, runs `prisma migrate deploy`, builds Next.js, and `pm2 reload mailtostory`. **Production `.env` is never overwritten.**

After deploy:

```bash
ssh root@31.97.77.179
pm2 logs mailtostory --lines 50
curl -fsS https://mailtostory.com/api/health
```

If you changed `.env` on the server (new Postmark/Stripe keys, etc.):

```bash
ssh root@31.97.77.179
cd /var/www/mailtostory
nano .env
pm2 reload mailtostory --update-env
```

You do **not** need to re-run bootstrap, Nginx, Certbot, or Postgres setup unless something broke. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for troubleshooting (502, OAuth redirect, DB).

---

## What you are turning on

| Service | Why users need it |
|---------|-------------------|
| **Postgres + NextAuth** | Accounts, sessions, workspaces |
| **Google OAuth** (optional) | “Sign in with Google” — identity only, no Gmail access |
| **Gemini** | Turns forwarded threads into stories |
| **Postmark inbound** | The private `@inbox.mailtostory.com` address |
| **Postmark outbound** | Verify email, password reset, team invites, story-ready mail |
| **Stripe** | Pro / Team checkout, seats, Customer Portal |

Free-plan forwarding works without Stripe. Paid upgrades do not.

---

## 0. Accounts to create

Open these and keep a notes file of IDs (never commit secrets):

1. [Google Cloud Console](https://console.cloud.google.com/) — OAuth client
2. [Google AI Studio](https://aistudio.google.com/) — Gemini key + billing
3. [Postmark](https://account.postmarkapp.com/) — inbound stream + outbound server
4. [Stripe](https://dashboard.stripe.com/) — products, webhook, Customer Portal
5. DNS at your registrar (Hostinger) — site A records, inbound MX, Postmark DKIM
6. Optional: [Google Analytics](https://analytics.google.com/), [Sentry](https://sentry.io/)

Generate three random secrets now; you will paste them later:

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -base64 32   # CRON_SECRET
openssl rand -hex 32      # POSTMARK_INBOUND_BASIC_PASSWORD — use hex (not base64) so the webhook URL has no / + =
```

NED: Generated passwords
cf346c6984694df0e423709e02d99073f28b5c0a1279f6c0847e63e584e6dff7
254849a2fb53662de6087243b8b294afe86ecd281bfcf2644f10336f134ccd6c
2df06eed858e5b3da1f60afca48c90ad5767b9edc347288fac1ad5516515aae8

---

## 1. Domain and HTTPS (site) — done

DNS for the **website** (not inbound mail) is already live:

| Type | Host | Value |
|------|------|--------|
| A | `@` | `31.97.77.179` |
| A | `www` | `31.97.77.179` |

Nginx, Certbot, and `https://mailtostory.com` were set up during the initial deploy. **Skip this** unless you move to a new server — then follow **[DEPLOYMENT.md](DEPLOYMENT.md)** from bootstrap through Certbot.

You need this URL before Google, Postmark, and Stripe will accept callbacks (already satisfied for this VPS).

---

## 2. Google sign-in (identity only) — configured

MailToStory does **not** read Gmail. Scopes are `openid email profile`. Users still **forward** threads to their inbound address.

Production OAuth client and redirect URI are already in server `.env`. Revisit only if sign-in breaks or you rotate credentials:

1. [Google Cloud Console](https://console.cloud.google.com/) → create or pick a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Mail To Story`
   - User support email and developer contact: your address
   - App home: `https://mailtostory.com`
   - Privacy: `https://mailtostory.com/privacy`
   - Terms: `https://mailtostory.com/terms`
   - Authorized domain: `mailtostory.com`
   - Scopes: `openid`, `email`, `profile` only — **do not** add Gmail
3. Publishing: **In production** (Testing limits you to listed test users).
4. **Credentials → Create credentials → OAuth client ID → Web application**
   - Authorized JavaScript origins:
     - `https://mailtostory.com`
     - `http://localhost:3001` (local)
   - Authorized redirect URIs:
     - `https://mailtostory.com/api/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google` (local)
5. Copy **Client ID** and **Client secret** → update production `.env` → `pm2 reload mailtostory --update-env`.

If you skip this step, email/password sign-up still works. Google is optional but expected on the homepage.

Verify domain ownership in [Search Console](https://search.google.com/search-console) if Google asks (DNS TXT at Hostinger).

---

## 3. Gemini (story generation) — API key on server

There is no Gemini “subscription”. Attach a **billing account** and pay per token.

`GEMINI_API_KEY` is already in production `.env`. Confirm billing is enabled and add the model line if missing:

1. Open [Google AI Studio](https://aistudio.google.com/) → your project → **Get API key**.
2. **Settings → enable billing** (moves the project to **Tier 1** pay-as-you-go).
3. Confirm **Settings → Rate limits**.
4. Set a **GCP billing budget alert** (for example $50–$100/month).
5. Leave the model as the app default: `gemini-2.5-flash`.

Budget about **$0.01 per average story**. See [DEPLOYMENT.md — Production Gemini setup](DEPLOYMENT.md#production-gemini-setup) for cost tables.

**Do not ship on the free tier.** It is ~10 RPM / ~250 RPD, returns 429s under load, and Google may use free-tier prompts to improve products.

Add or verify on the server (`ssh root@31.97.77.179`, `nano /var/www/mailtostory/.env`):

```env
GEMINI_API_KEY="..."          # already set
GEMINI_MODEL="gemini-2.5-flash"
```

Then `pm2 reload mailtostory --update-env`. No full redeploy required for `.env`-only changes.

Optional later: `GEMINI_API_KEY_FALLBACKS` from a second project if you hit daily caps.

---

## 4. Postmark — still needed

You need **two** things on the same Postmark server: inbound (receive forwards) and outbound (transactional mail). **Not yet in production `.env`** — complete this before users can verify email, forward threads, or get story-ready notifications.

### 4a. Outbound — sender domain

Users cannot verify their account, reset a password, or get story-ready email without this.

1. Postmark → **Sender Signatures** (or **Domains**) → add `mailtostory.com`.
2. Add the DNS records Postmark shows (DKIM CNAME, Return-Path/Bounce CNAME, optional DMARC).
3. Click **Verify** after DNS propagates (often 5–30 minutes).
4. **From address** — once the domain is verified, you can send from any `@mailtostory.com` address (e.g. `noreply@`). There is no separate “display name” field in Postmark; the friendly name `Mail To Story` is set in `POSTMARK_FROM_EMAIL` (section 4c).
5. Copy the **Server API token** (Server → **API Tokens**).

Outbound mail the app sends:

- Email verification after sign-up
- Password reset
- Team invites
- Story-ready (magic link)
- Forwarding-address / allowlist notices
- GDPR deletion confirmation

### 4b. Inbound — `inbox.mailtostory.com`

This is the product: each workspace gets an address like `abc123@inbox.mailtostory.com`.

1. Postmark → **Message Streams** → add an **Inbound** stream (or open the default inbound stream).

2. **MX record at Hostinger** — tells the internet to deliver mail for `@inbox.mailtostory.com` to Postmark. Add **only** on the `inbox` subdomain (Host = `inbox`), **not** on the root `@` record:

| Type | Host | Value | Priority |
|------|------|--------|----------|
| MX | `inbox` | `inbound.postmarkapp.com` | 10 |

Do **not** point `mailtostory.com` MX at Postmark — that would hijack normal mail to the domain. Outbound mail (`noreply@mailtostory.com`) uses DKIM on the root domain (section 4a); inbound uses this separate subdomain.

3. **Production `.env` first** — add the Postmark inbound vars from section 4c, then `pm2 reload mailtostory --update-env`. The webhook test will return **503** or **401** until these match Postmark.

4. **Inbound domain forwarding** (Postmark Inbound stream → Settings)
   - **Inbound domain:** `inbox.mailtostory.com`
   - Save. You already added the MX record in step 2; this tells Postmark to accept mail for that subdomain.

5. **Inbound webhook** (same Settings page — there is **no** separate “HTTP Basic auth” toggle for inbound)
   - **Inbound webhook URL** — embed credentials in the URL ([Postmark docs](https://postmarkapp.com/developer/webhooks/webhooks-overview#basic-http-authentication)):

     ```
     https://mailtostory:YOUR_HEX_PASSWORD@mailtostory.com/api/inbound/postmark
     ```

     Replace `YOUR_HEX_PASSWORD` with the same value as `POSTMARK_INBOUND_BASIC_PASSWORD` in `.env`. The username (`mailtostory`) must match `POSTMARK_INBOUND_BASIC_USER`. Use the **hex** password from step 0 — base64 passwords contain `/` and `+` which break URL parsing. If you must use a base64 password, URL-encode `/` → `%2F`, `+` → `%2B`, `=` → `%3D` in the webhook URL only (keep the raw password in `.env`).
   - **Include raw email content in JSON payload:** leave **unchecked** — the parsed body, headers, and attachments are enough.
   - Click **Save changes**, then **Check** next to the URL. Expect **HTTP 200**.

6. **Real test** — forward a short email from your signup mailbox to your dashboard `@inbox.mailtostory.com` address; the thread should appear within a minute or two.

### 4c. Production `.env` for Postmark

```env
POSTMARK_INBOUND_DOMAIN="inbox.mailtostory.com"
POSTMARK_INBOUND_BASIC_USER="mailtostory"
POSTMARK_INBOUND_BASIC_PASSWORD="..."
POSTMARK_SERVER_TOKEN="..."
POSTMARK_FROM_EMAIL="Mail To Story <noreply@mailtostory.com>"
```

`POSTMARK_WEBHOOK_TOKEN` is an optional extra header check if your webhook provider can send custom headers. Inbound Postmark webhooks use URL-embedded Basic auth (section 4b) instead.

---

## 5. Stripe (paid plans) — still needed

Create products in **live** mode when you are ready for real cards. Use **test** mode first (`sk_test_…` / `pk_test_…`) until checkout works end-to-end. **Not yet in production `.env`** — free-plan forwarding works without Stripe; paid upgrades do not.

### 5a. Products and prices

Dashboard → **Products → Add product**. Create **two products** (Pro and Team), each with a **monthly** and **yearly** price. Match the amounts in `src/lib/billing/plans.ts`:

| Product | Billing | Amount | Env var |
|---------|---------|--------|---------|
| Mail To Story Pro | Recurring, monthly | **$14.99** USD | `STRIPE_PRICE_PRO` |
| Mail To Story Pro | Recurring, yearly | **$149.99** USD | `STRIPE_PRICE_PRO_ANNUAL` |
| Mail To Story Team | Recurring, monthly, **per unit** | **$24.99** USD / seat | `STRIPE_PRICE_TEAM` |
| Mail To Story Team | Recurring, yearly, **per unit** | **$249.99** USD / seat | `STRIPE_PRICE_TEAM_ANNUAL` |

For Team, checkout sends `quantity` = seat count. The price must be **per unit**, not a flat amount.

Copy each **Price ID** (`price_…`), not the Product ID (`prod_…`).

#### Suggested names and descriptions (paste into Stripe)

Stripe shows the **product name** and **description** on Checkout, invoices, and the Customer Portal. Keep them aligned with the pricing page so customers recognize what they bought.

**Product 1 — Mail To Story Pro**

| Stripe field | Suggested value |
|--------------|-----------------|
| **Name** | `Mail To Story Pro` |
| **Description** | `Personal plan for Mail To Story — forward email threads to your private address and read them as structured stories, timelines, and action lists. Includes 500 story credits per month (fair use), search, exports, and one inbound forwarding address.` |
| **Monthly price nickname** | `Pro monthly` |
| **Annual price nickname** | `Pro annual (save 2 months)` |

**Product 2 — Mail To Story Team**

| Stripe field | Suggested value |
|--------------|-----------------|
| **Name** | `Mail To Story Team` |
| **Description** | `Team plan for Mail To Story — shared inbox address, shared story library, and seat management for colleagues. Each seat includes 500 story credits per month (fair use). Billed per seat; quantity is set at checkout.` |
| **Pricing model** | **Flat rate** (see below) |
| **Monthly price nickname** | `Team seat monthly` |
| **Annual price nickname** | `Team seat annual (save 2 months)` |

**Team — which pricing model in Stripe?**

Choose **Flat rate** (the option that says *“fixed price for a single unit, package, or seat”*).

| Stripe option | Use for Team? | Why |
|---------------|---------------|-----|
| **Flat rate** | **Yes** | App sends `quantity` = seat count at checkout and updates quantity when seats change. Amount is **$24.99 per seat / month** (or **$249.99 per seat / year**) — not a flat total for the whole team. |
| Package pricing | No | Bundles (e.g. “5 seats for $100”) — app does not support this. |
| Tiered pricing | No | Volume discounts by tier — app uses one price ID per interval, not tiers. |
| Usage-based | No | Metered billing — credits are enforced in-app, not via Stripe meters. |

When adding each Team price:

1. **Pricing model:** Flat rate  
2. **Price:** `$24.99` monthly or `$249.99` yearly  
3. **Billing period:** Monthly or Yearly  
4. If Stripe shows **“Per unit”** or lets you set quantity on subscriptions, leave it enabled — checkout passes seat count as quantity.

Example: 4 seats on monthly Team → Stripe charges **4 × $24.99 = $99.96/mo**.

**Optional (recommended) — statement descriptor**

Under each product → **More options** → set **Statement descriptor** to `MAIL TO STORY` (max 22 characters; this is what appears on card statements). If Stripe asks for a shorter form, use `MAILTOSTORY`.

**Tax and metadata (optional)**

- **Tax behavior:** if you are not VAT-registered, leave tax off for now (matches the [Refunds page](https://mailtostory.com/refunds) — prices shown in USD, no VAT added).
- You do **not** need custom metadata on products; checkout already sends `workspaceId`, `plan`, and `interval` from the app.

**Sanity check after creating prices**

1. Pro monthly + annual both map to the same product in Stripe.
2. Team prices are **per unit** / **per seat**, not a flat team total.
3. Annual amounts are **$149.99** (Pro) and **$249.99 per seat** (Team) — not “per month” fields; Stripe bills once per year.

### 5b. Customer Portal

**Settings → Billing → Customer portal**

Users open this from **Settings → Billing → Manage subscription** to update their card and view invoices. Without an activated portal, that button errors.

#### Do you need to set this up in test mode?

**Yes — if you are testing checkout end-to-end with `sk_test_…` keys.** Test mode and live mode have **separate** portal settings. The orange banner in Stripe (“changes only apply to test mode”) is expected.

**What to do now (test mode):**

1. Stay in **Test mode** (toggle in Stripe Dashboard).
2. Open **Settings → Billing → Customer portal**.
3. Expand and enable:
   - **Payment methods** — let customers update their card
   - **Invoices** — show invoice history
   - **Customer information** — optional; billing name/address updates
4. Under **Subscriptions**, allow **cancellation** if you want cancel-in-portal as well as in-app (the app also has **Cancel at period end** on the billing page).
5. Click **Save changes**.

You do **not** need **“Activate test link”** / **“Launch customer portal with a link”** for MailToStory. That no-code link is for sharing a standalone portal URL. The app creates portal sessions via the API (`/api/stripe/portal`) when someone clicks **Manage subscription**.

**When you go live:** switch Stripe to **Live mode**, open the same **Customer portal** page, repeat steps 3–5, and **Save changes** again. Live portal settings are independent of test.

Suggested portal options: payment method updates, invoice history, and cancellation. Plan upgrades/downgrades (Free ↔ Pro ↔ Team) go through the in-app billing UI, not the portal.

### 5c. Webhook

**Developers → Webhooks → Add endpoint**

- URL: `https://mailtostory.com/api/stripe/webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

Copy the **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

### 5d. API keys

**Developers → API keys**

```env
STRIPE_SECRET_KEY="sk_live_..."                 # or sk_test_... while testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_PRO_ANNUAL="price_..."
STRIPE_PRICE_TEAM="price_..."
STRIPE_PRICE_TEAM_ANNUAL="price_..."
```

Emails listed in `ADMIN_EMAILS` can change plans in-app without Stripe (for your own testing). Real customers still need the live keys above.

---

## 6. Production `.env` — add missing keys

The server already has a working `.env` with auth, database, Google, Gemini, and GA. **Do not replace it** — add the blocks below for Postmark, Stripe, cron, and admin.

```bash
ssh root@31.97.77.179
cd /var/www/mailtostory
nano .env
```

Keep existing values. Add anything missing (compare with `.env.example` in the repo):

```env
NODE_ENV=production
PORT=3010

NEXTAUTH_URL=https://mailtostory.com
NEXTAUTH_SECRET="..."          # already set

DATABASE_URL="postgresql://mailtostory:PASSWORD@localhost:5432/mailtostory?schema=public"   # already set

GOOGLE_CLIENT_ID="..."         # already set
GOOGLE_CLIENT_SECRET="..."     # already set

GEMINI_API_KEY="..."           # already set
GEMINI_MODEL="gemini-2.5-flash"

POSTMARK_INBOUND_DOMAIN="inbox.mailtostory.com"      # add — section 4
POSTMARK_INBOUND_BASIC_USER="mailtostory"
POSTMARK_INBOUND_BASIC_PASSWORD="..."
POSTMARK_SERVER_TOKEN="..."
POSTMARK_FROM_EMAIL="Mail To Story <noreply@mailtostory.com>"

STRIPE_SECRET_KEY="sk_live_..."                      # add — section 5
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_PRO_ANNUAL="price_..."
STRIPE_PRICE_TEAM="price_..."
STRIPE_PRICE_TEAM_ANNUAL="price_..."

CRON_SECRET="..."                                    # add — section 7
ADMIN_EMAILS="you@example.com"

NEXT_PUBLIC_GA_MEASUREMENT_ID="G-P43B4NBGRL"         # already set
```

After editing `.env`:

```bash
pm2 reload mailtostory --update-env
```

Then deploy the latest app from your Mac:

```bash
npm run deploy
```

`npm run deploy` syncs code and reloads PM2; it does not touch `.env`. Run it whenever you want the server build to match your local repo (migrations + Next.js build included).

---

## 7. Daily maintenance cron — still needed

On the VPS (`crontab -e`). Generate `CRON_SECRET` in step 0 if you have not already, add it to `.env`, then:

```cron
15 4 * * * curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" https://mailtostory.com/api/cron/maintenance >/dev/null
```

This clears expired quarantine, story-access tokens, old generation logs, and stories left in Recently deleted for 30 days.

Point an uptime monitor at `GET https://mailtostory.com/api/health`.

Backups, R2, ClamAV, and Sentry are optional; see [DEPLOYMENT.md — Operations](DEPLOYMENT.md#operations-health-cron-backups).

---

## 8. Optional: analytics — done

GA4 is already wired (`NEXT_PUBLIC_GA_MEASUREMENT_ID` on the server). To change the property:

1. Create a GA4 property → copy Measurement ID (`G-…`).
2. Update production `.env`.
3. `pm2 reload mailtostory --update-env` (or redeploy). The cookie banner gates analytics; necessary cookies work without this.

---

## 9. Smoke test (do this before sharing the URL)

Work through this as a stranger would:

1. Open `https://mailtostory.com` — homepage, pricing, privacy, terms.
2. Sign up with email/password → verification mail from `noreply@mailtostory.com` → click the link.
3. Sign in with Google (if configured) — no Gmail permission screen.
4. Dashboard shows a private address `@inbox.mailtostory.com`.
5. Forward a short real thread to that address from the **same** mailbox you signed up with.
6. Story appears (or pending → ready). Story-ready email arrives with a working magic link.
7. Settings → Billing → upgrade to Pro in **test** mode, then refund/cancel.
8. `/api/health` returns `{ "ok": true, "db": "ok" }`.

If inbound never arrives: MX on `inbox.mailtostory.com`, inbound domain set in Postmark, webhook URL (with embedded Basic auth) and `.env` password must match exactly. Webhook **Check** should return 200 before you forward mail. Check `pm2 logs mailtostory`.

If stories fail: Gemini key + billing, then `[gemini]` lines in the same logs.

If checkout stays Free after payment: webhook URL, `whsec_` secret, and live vs test mode mismatch are the usual causes.

---

## 10. Launch-day checklist

**Infrastructure (done on current VPS)**

- [x] `https://mailtostory.com` and `www` on HTTPS
- [x] Postgres + PM2 `mailtostory` on port 3010
- [x] Google OAuth in production `.env`
- [x] Gemini API key in production `.env`
- [x] Google Analytics (`G-P43B4NBGRL`)

**App update (do now)**

- [ ] `npm run deploy` from Mac — brings server to current repo (last deploy: 2026-08-02)
- [ ] `/api/health` returns `{ "ok": true, "db": "ok" }` after deploy

**Still needed before full launch**

- [ ] Postmark sender domain verified; test verify-email received
- [ ] MX for `inbox.mailtostory.com` only; inbound webhook 200
- [ ] Postmark + Stripe keys in production `.env`
- [ ] Stripe live prices + webhook + Customer Portal (or test mode first)
- [ ] `CRON_SECRET` in `.env` + maintenance cron on VPS
- [ ] `ADMIN_EMAILS` set to your address only
- [ ] Privacy, terms, and cookie banner live (verify after deploy — marketing pages updated locally)
- [ ] Smoke test (section 9) passed

You can send people to **mailtostory.com** for sign-in and Google auth today. Forwarding, transactional email, and paid checkout require Postmark and Stripe above.
