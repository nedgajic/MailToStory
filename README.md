# Gmail Story

Next.js app at [gmailstory.com](https://gmailstory.com): sign in with Google (read-only Gmail), pick a thread, get an LLM-generated **story** (narrative, timeline, actions) in a reader-style UI.

## Prerequisites

- **Node 20.9+** (check with `node -v`; use [nodejs.org](https://nodejs.org/) or `nvm install 20`)
- **Postgres:** either **Docker** (included—see below) or a hosted database
- [Google Cloud](https://console.cloud.google.com/) project with **Gmail API** enabled and **OAuth consent** configured
- [Gemini API](https://ai.google.dev/) key

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
   postgresql://gmailstory:gmailstory_dev@localhost:5434/gmailstory?schema=public
   ```

   The app uses host port **5434** by default so it stays out of the way of Postgres on **5432** and other tools that often use **5433**. If Docker says the port is **already allocated**, edit `docker-compose.yml` (change `5434` to another free port, e.g. `15432`) and set the same port in `DATABASE_URL`.

   If you previously used the old `gmaildigest` Docker credentials, recreate the volume: `docker compose down -v`, then `docker compose up -d`, and update `DATABASE_URL` in `.env`.

   If `npx prisma migrate deploy` fails with **P1010** / access denied, you are probably hitting the wrong server—confirm `DATABASE_URL` matches the **first** port number in `docker-compose.yml` and run `docker compose ps` to ensure the `db` service is up.

   **Only for local dev.** Change the password in `docker-compose.yml` + `.env` if you expose this machine.

   *No Docker?* Use [Neon](https://neon.tech/) or similar and put their URI in `DATABASE_URL` instead.

3. **Environment**

   ```bash
   cp .env.example .env
   ```

   Fill in / adjust:

   - `DATABASE_URL` – use the Docker URL above, or your hosted DB URL
   - `NEXTAUTH_URL` – e.g. `http://localhost:3000` (production: `https://gmailstory.com`)
   - `NEXTAUTH_SECRET` – `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – OAuth *Web application* client
   - `GEMINI_API_KEY` – Google AI Studio key

   OAuth redirect URI (Google Cloud Console):

   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://gmailstory.com/api/auth/callback/google`

   Scopes are requested automatically (`gmail.readonly`, email, profile, openid).

4. **Database schema**

   ```bash
   npx prisma migrate deploy
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), sign in, open **Threads**, then open a thread.

## What only you can provide (secrets and cloud)

Nobody else can create these for you on your machine:

- Postgres **connection string** (`DATABASE_URL`)
- Google Cloud **OAuth Client ID / Secret** and **Gmail API** enabled
- **`NEXTAUTH_SECRET`** (random; e.g. `openssl rand -base64 32`)
- **Gemini API key**

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

### Deploy (sketch)

- Host at **gmailstory.com** with the same env vars as local; point `DATABASE_URL` at a hosted Postgres.
- Set `NEXTAUTH_URL=https://gmailstory.com`.
- In Google Cloud Console, add your site origin and redirect URI `https://gmailstory.com/api/auth/callback/google`.
- Run `npx prisma migrate deploy` against production before first traffic; then `npm run build` / start as usual.

## Architecture (short)

- **Auth:** [NextAuth.js](https://next-auth.js.org/) (database sessions) + Prisma + Google provider; refresh token stored for Gmail access.
- **Gmail:** `googleapis` — list threads and load full thread for story generation.
- **LLM:** Gemini — tries several models (default starts with **gemini-2.5-flash**) because free-tier quota is **per model**; `gemini-2.0-flash` sometimes shows `limit: 0` even on the first request. Override with `GEMINI_MODEL` / `GEMINI_MODEL_FALLBACKS`, or enable billing for higher limits ([rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)).

## Privacy note

Story text is produced on demand and returned to your browser. This MVP does not persist email bodies in the app database—only auth/session/account tokens as required by NextAuth.
