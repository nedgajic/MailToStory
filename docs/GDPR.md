# GDPR Compliance Checklist — MailToStory

This checklist documents implemented measures and manual operational steps for GDPR compliance at mailtostory.com.

**Data controller:** NEDix s.p. — privacy contact: nedix2018@gmail.com

---

## 1. Implemented (Code)

| Item | Status | Notes |
|------|--------|-------|
| **Cookie consent banner** | Done | Accept / Reject / Customize — `src/components/cookie-consent/` |
| **Consent storage** | Done | `localStorage` key `mts_cookie_consent_v1` |
| **Google Analytics gating** | Done | Loads only after analytics consent — `src/components/google-analytics.tsx` |
| **IP anonymization** | Done | `anonymize_ip: true` in GA config |
| **Ad personalization** | Done | Disabled in GA config |
| **Privacy Policy** | Done | `/privacy` — controller, legal basis, rights, transfers |
| **Cookie Policy** | Done | `/cookies` — cookie/localStorage table + settings button |
| **Terms of Service** | Done | `/terms` |
| **Footer / app legal links** | Done | Privacy, Cookies, Terms, Data Request |
| **Signup consent** | Done | Required checkbox + server validation on register |
| **Delete account** | Done | Settings → Profile — `POST /api/account/delete` |
| **Data export (registered)** | Done | Settings → Profile — `GET /api/account/export` |
| **Data request (non-account)** | Done | `/data-request` + `POST /api/gdpr/request-export` / `request-deletion` |
| **Rate limiting (GDPR APIs)** | Done | 5 requests/hour per email+IP — `src/lib/gdpr/rate-limit.ts` |

---

## 2. Manual / Operational Steps

| Task | Owner | Notes |
|------|-------|-------|
| **GA Data Retention** | Admin | Google Analytics Admin → Data Settings → set retention (e.g. 14 months) |
| **Google DPA** | Admin | Accept Google Analytics / Google Cloud Data Processing Terms |
| **Stripe DPA** | Admin | Stripe Dashboard → Legal → Data Processing Agreement |
| **Postmark DPA** | Admin | Review Postmark terms and DPA for email processing |
| **SSL / HTTPS** | Ops | Site must run over HTTPS (nginx + certbot on VPS) |
| **Privacy contact** | Admin | Monitor nedix2018@gmail.com for data-subject requests |

---

## 3. Verify After Deploy

1. Visit site in a private window — cookie banner appears.
2. Reject non-essential — no requests to `googletagmanager.com`.
3. Accept analytics — GA loads; check Network tab.
4. Open `/cookies` → **Open cookie settings** opens the modal.
5. Sign up without checkbox — blocked client-side and via API.
6. Settings → Profile → **Export my data** downloads JSON.
7. `/data-request` — export/deletion for non-account email works; active account email returns sign-in message.

---

## 4. Future (When Added)

| Feature | Action |
|---------|--------|
| **Newsletter / marketing email** | Separate opt-in, unsubscribe link, update Cookie Policy marketing section |
| **Registered company address** | Add `BRAND_LEGAL_ADDRESS` to `src/lib/brand.ts` and Privacy Policy |
| **Cookie consent version bump** | Increment `CONSENT_VERSION` in `src/lib/cookie-consent.ts` to re-prompt users after material policy changes |
