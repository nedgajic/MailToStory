# MailToStory

Next.js app at [mailtostory.com](https://mailtostory.com): sign up, get a private inbound address, **forward** a thread from Gmail/Outlook/Apple Mail, and read an LLM-generated **story** (narrative, timeline, actions). There is no Gmail API access.

## Prerequisites

- **Node 20.9+** (check with `node -v`; use [nodejs.org](https://nodejs.org/) or `nvm install 20`)
- **Postgres:** either **Docker** (included—see below) or a hosted database
- [Gemini API](https://ai.google.dev/) key
- Optional: Postmark (inbound + transactional email), Stripe (paid plans), Google OAuth (identity-only sign-in)

## Setup (minimum you must do yourself)

Automated checks after cloning:

```bash
npm run doctor
```

1. **Install dependencies**

   ```bash
   npm install
   ```

   If install fails, try a clean install (fixes many lockfile/cache issues):

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

   Still failing? Copy the **full** terminal output (from the first `npm install` line through the last error) and share it—without that, fixes are guesswork.

2. **Postgres (Docker — fixed username/password)**

   From the project root:

   ```bash
   docker compose up -d
   ```

   Wait until the DB is healthy (a few seconds). Default URL (already in `.env.example`):

   ```text
   postgresql://mailtostory:mailtostory_dev@localhost:5434/mailtostory?schema=public
   ```

   The app uses host port **5434** by default so it stays out of the way of Postgres on **5432** and other tools that often use **5433**. If Docker says the port is **already allocated**, edit `docker-compose.yml` (change `5434` to another free port, e.g. `15432`) and set the same port in `DATABASE_URL`.

   If you previously used the old `gmailstory` or `gmaildigest` Docker credentials, recreate the volume: `docker compose down -v`, then `docker compose up -d`, and update `DATABASE_URL` in `.env`.

   If `npx prisma migrate deploy` fails with **P1010** / access denied, you are probably hitting the wrong server—confirm `DATABASE_URL` matches the **first** port number in `docker-compose.yml` and run `docker compose ps` to ensure the `db` service is up.

   **Only for local dev.** Change the password in `docker-compose.yml` + `.env` if you expose this machine.

   *No Docker?* Use [Neon](https://neon.tech/) or similar and put their URI in `DATABASE_URL` instead.

3. **Environment**

   ```bash
   cp .env.example .env
   ```

   Fill in / adjust:

   - `DATABASE_URL` – use the Docker URL above, or your hosted DB URL
   - `NEXTAUTH_URL` – e.g. `http://localhost:3000` (production: `https://mailtostory.com`)
   - `NEXTAUTH_SECRET` – `openssl rand -base64 32`
   - `GEMINI_API_KEY` – Google AI Studio key
   - Optional `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – identity-only Google sign-in (no Gmail scopes)
   - Optional Postmark + Stripe keys — see `.env.example` and **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

   If you enable Google sign-in, OAuth redirect URI:

   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://mailtostory.com/api/auth/callback/google`

4. **Database schema**

   ```bash
   npx prisma migrate deploy
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), create an account, then open **Dashboard** for your inbound address.

## What only you can provide (secrets and cloud)

Nobody else can create these for you on your machine:

- Postgres **connection string** (`DATABASE_URL`)
- **`NEXTAUTH_SECRET`** (random; e.g. `openssl rand -base64 32`)
- **Gemini API key**
- Optional: Google **OAuth Client ID / Secret** (identity only), Postmark tokens, Stripe keys

Everything else is either in the repo or one command away (`npm install`, `npx prisma migrate deploy`, `npm run dev`).

## Scripts

| Command           | Purpose                |
| ----------------- | ---------------------- |
| `npm run doctor`  | Node version + quick file checks |
| `npm run dev`     | Dev server             |
| `npm run build`   | Production build       |
| `npm run test`    | Vitest (unit tests)    |
| `npm run lint`    | ESLint                 |

## Roadmap

Prioritized backlog and tiers: **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**.

### Deploy (Hostinger VPS — shared with dt-wellness)

Pre-configured for the same VPS (`31.97.77.179`). See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

```bash
npm run deploy:bootstrap   # one-time: verify remote dir + print DB/nginx hints
npm run deploy:dry-run
npm run deploy
```

MailToStory runs on **port 3010** (`mailtostory` PM2 app). dt-wellness (5173), Strapi (1337), and Medusa (9000) are unchanged.

## Architecture (short)

- **Auth:** [NextAuth.js](https://next-auth.js.org/) JWT sessions + Prisma; email/password plus optional Google identity.
- **Inbound:** Postmark webhook stores forwarded mail; Gemini generates a story from that copy.
- **LLM:** Gemini — tries each API key (`GEMINI_API_KEY`, optional `GEMINI_API_KEY_FALLBACKS`), then similar Flash models per key (default **gemini-2.5-flash** → **gemini-2.5-flash-lite** → **gemini-2.0-flash-lite**) because free-tier quota is **per model** and **per project**. Override with `GEMINI_MODEL` / `GEMINI_MODEL_FALLBACKS`, or enable billing for higher limits ([rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)).
- **Billing:** Stripe Checkout, Customer Portal, invoices, and seat quantity for Team.

## Privacy note

Forwarded mail and generated stories are stored in your workspace until you delete them. We never connect to your inbox. See the in-app [Privacy Policy](https://mailtostory.com/privacy).
