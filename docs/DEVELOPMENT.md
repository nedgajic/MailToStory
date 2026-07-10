# Gmail Story — development plan

This is a living backlog: **done** reflects the current repo; **next** is ordered by impact vs. effort.

---

## Done (baseline product)

- [x] Google OAuth (read-only Gmail) + session storage (Prisma / NextAuth)
- [x] List multi-message threads; open thread → streaming Gemini digest
- [x] Digest schema: story, timeline (`message_index`), actions, participants; language alignment in prompts
- [x] UI: recap panel, tabbed Story / Timeline / Actions, speaker colors, Gravatar avatars (via participant email match)
- [x] Original message modal: sanitized HTML + quoted-thread stripping; plain-text fallback
- [x] Per-paragraph “source” + timeline deep-link to Gmail message
- [x] Vitest coverage for schema, prompts, sanitization, avatars

---

## Next — refine & ship

### Tier A — Quick wins (this PR / short sprint)

_All items below are implemented unless noted._

- [x] **Thread list filter** — client-side search over subject + snippet + date (no extra API calls).
- [x] **Copy digest as Markdown** — one click for notes / Slack / LLM follow-ups.
- [x] **README deploy note** — minimal Vercel (or host) checklist: env vars, `DATABASE_URL`, redirect URI, Gmail verification.
- [x] **Keyboard** — `/` focuses thread search on `/threads`.

### Tier B — Reliability & trust

- [ ] **Rate limiting** — per-user throttle on `POST /api/digest` (in-memory or Upstash) to cap cost + abuse.
- [ ] **Structured errors** — user-visible messages for Gmail 401, Gemini 429, empty thread; retry hint for quota.
- [ ] **E2E smoke** — Playwright: sign-in stub or health route + thread page render with mocked digest API.

### Tier C — Quality of digest

- [ ] **Stronger `message_index` recovery** — when the model omits index, heuristic map from timeline date + actor to Gmail order (last resort).
- [ ] ~~Optional People API for contact photos~~ — not planned (privacy + latency); Gravatar + initials only.
- [ ] **Inline CID images** — resolve `cid:` in HTML originals via Gmail `messages.attachments.get` (larger payload).

### Tier D — Persistence & product depth

- [ ] **Optional digest cache** — store last digest per `(userId, threadId)` with TTL; “regenerate” button invalidates.
- [ ] **Thread metadata index** — background job or on-open sync of thread list to DB for faster list + full-text search later.
- [x] **PDF export** — server-generated A4 PDF (`/api/digest-pdf`) matching recap / story / timeline / actions / participants.
- [ ] **Other export** — download `.md` file (without using clipboard); print stylesheet.

### Tier E — Stretch

- [ ] Scheduled / batched digests (cron + email).
- [ ] Multi-label or query builder for “which threads to digest”.
- [ ] Team workspace (shared OAuth app, org billing) — only if usage justifies.

---

## Principles

1. **Privacy first** — avoid storing raw email bodies unless there is an explicit, user-visible cache feature with TTL.
2. **Graceful degradation** — Gravatar 404, missing HTML part, model JSON drift: always show something usable.
3. **Cost awareness** — Gemini tokens dominate; prefer caching and throttles before adding heavy batch features.

---

## How to use this doc

- Tick items in **Done** when merged; move speculative ideas to **Stretch** instead of blocking **Tier A**.
- For each ticket, prefer a single PR with tests touching any new `src/lib/*` logic.
