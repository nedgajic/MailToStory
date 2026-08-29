# Google OAuth verification checklist (MailToStory)

Use this after deploying the privacy and terms pages to production.

## Branding vs app verification (important)

Google runs **two different reviews**. Passing one does **not** clear the other.

| Review | What it checks | Removes “Google hasn’t verified this app”? |
|--------|----------------|------------------------------------------|
| **Branding verification** | App name, logo, homepage, privacy policy URLs match what users see | **No** |
| **App verification (sensitive scopes)** | Your use of scopes like `gmail.readonly`, demo video, privacy policy content, data handling | **Yes** |

If branding shows as verified but users still see the warning, **scope verification is still pending or not submitted**. Branding approval can take minutes; scope verification usually takes **several days to a few weeks**.

Until scope verification is approved, users can still sign in via **Advanced → Go to mailtostory.com (unsafe)**.

## URLs to enter in Google Cloud Console

Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen** and **Credentials**.

| Field | URL |
|-------|-----|
| Application home page | `https://mailtostory.com` |
| Privacy policy | `https://mailtostory.com/privacy` |
| Terms of service | `https://mailtostory.com/terms` |

The privacy link on the homepage footer and in the app account menu must match the OAuth consent screen URL exactly.

## OAuth client (Credentials)

**Authorized JavaScript origins**

```
https://mailtostory.com
```

(Optional for local dev on the same client: `http://localhost:3001`)

**Authorized redirect URIs**

```
https://mailtostory.com/api/auth/callback/google
```

(Optional for local dev: `http://localhost:3001/api/auth/callback/google`)

## Authorized domains

Under **OAuth consent screen → Authorized domains**, include:

```
mailtostory.com
```

## Domain ownership (Search Console)

Google requires you to verify domain ownership:

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property **Domain** `mailtostory.com` (or URL prefix `https://mailtostory.com`)
3. Add the DNS TXT record at your registrar (Hostinger)
4. Use the same Google account that owns the Cloud project (Owner or Editor)

## APIs to enable

In **APIs & Services → Library**, enable:

- **Gmail API**
- **Google People API** (optional; profile only)

## Scopes to declare

On the OAuth consent screen, add and justify:

| Scope | Why MailToStory needs it |
|-------|--------------------------|
| `openid`, `email`, `profile` | Sign-in and account display |
| `https://www.googleapis.com/auth/gmail.readonly` | List inbox threads and read messages the user opens to generate summaries |

**Justification text (example for submission):**

> MailToStory is a reading tool that turns long Gmail threads into structured stories, timelines, and action lists. Users sign in with Google and explicitly open threads they want summarized. We request gmail.readonly only—no send, modify, or delete. Email content is fetched on demand, sent to Google Gemini for on-request summarization, and shown to the signed-in user. Raw message bodies are not stored in our database; we cache generated summaries and OAuth tokens needed to maintain the session.

## Demo video (required for verification)

Full shot-by-shot script: **[docs/DEMO_VIDEO_SCRIPT.md](DEMO_VIDEO_SCRIPT.md)**

Record a 3–5 minute screen capture showing:

1. Homepage at `https://mailtostory.com` with Privacy Policy link visible in the footer
2. Click **Sign in with Google** → OAuth consent screen
3. Grant access → land in `/threads`
4. Open a thread → generate or view a story
5. Show export (PDF or Markdown) if available
6. Show **Privacy Policy** link in the account menu (top-right)
7. Show revoking access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions) (optional but helpful)

Upload the video to YouTube (unlisted) or Google Drive and paste the link in the verification form.

## Publishing status

- **Testing** — only test users you add can sign in; good for personal use; warning may still appear
- **In production** — required for public users; triggers verification for `gmail.readonly`

For verification, set **In production** and submit via **Go to verification center**.

### Check verification status

In Cloud Console → **OAuth consent screen**:

1. **Publishing status** — should be **In production** (not Testing)
2. **Verification status** (top of page) — look for:
   - “Verification in progress” → wait; warning stays until approved
   - “Needs verification” / **Submit for verification** → you have not finished scope review yet
   - “Verified” (for the app / OAuth client) → warning should disappear (may take a short propagation delay)

Branding verified ✓ alone is **not** the same as this status showing verified for sensitive scopes.

## After code deploy

```bash
npm run deploy
```

Verify live:

```bash
curl -I https://mailtostory.com/privacy
curl -I https://mailtostory.com/terms
```

Both should return `HTTP/2 200`.

## Contact email

Use `nedix2018@gmail.com` (matches OAuth consent screen user support email).

## Common rejection reasons

- Privacy policy URL on consent screen ≠ link on homepage
- Privacy policy does not mention Gmail data use or Limited Use
- Homepage is only a login page (MailToStory homepage describes the product — OK)
- Domain not verified in Search Console
- Demo video missing OAuth grant step or app functionality
