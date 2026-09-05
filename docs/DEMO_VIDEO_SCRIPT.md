# Google OAuth verification — demo video script

Use this when submitting Mail To Story for **sensitive scope** verification (`gmail.readonly`).

**Target length:** 3–5 minutes  
**Format:** Screen recording with optional voiceover (voiceover helps reviewers)  
**Upload:** YouTube (Unlisted) or Google Drive (anyone with link)  
**Resolution:** 1280×720 or higher; show full browser window

---

## Before you record

- [ ] Scopes added in Cloud Console → **Data access** (including `gmail.readonly`)
- [ ] Signed in to https://mailtostory.com with a Gmail account that has at least one real thread
- [ ] Close unrelated tabs; hide bookmarks bar if cluttered
- [ ] Use Chrome in normal (not Incognito) window so OAuth flow is visible
- [ ] Optional: enable mic for short narration per step

---

## Shot list (follow in order)

### 1. Homepage and branding (0:00 – 0:40)

**Show:** https://mailtostory.com

**Do:**
- Scroll slowly from top to bottom
- Point out app name **Mail To Story** and short product description
- Scroll to **“Built for trust”** / privacy section
- Scroll to footer → click **Privacy Policy** → page loads at `https://mailtostory.com/privacy`
- Briefly scroll the privacy policy (show Gmail / Limited Use sections exist)
- Go back to homepage

**Say (optional):**
> This is Mail To Story. It turns long Gmail threads into readable stories, timelines, and action lists. Our privacy policy is linked from the homepage footer.

---

### 2. Start sign-in (0:40 – 1:00)

**Show:** Homepage hero

**Do:**
- Click **Continue with Google** (or **Sign in**)

**Say (optional):**
> Users sign in with their Google account. We only request read-only Gmail access.

---

### 3. OAuth consent screen (1:00 – 1:45)

**Show:** Google account picker → consent screen

**Do:**
- Select your Google account
- If you see **“Google hasn’t verified this app”** → click **Advanced** → **Go to mailtostory.com (unsafe)**  
  *(This is fine for the demo; reviewers expect unverified apps during review.)*
- On the consent screen, **pause 3–5 seconds** so reviewers can read:
  - App name: Mail To Story
  - Requested permissions (View your email messages and settings / Gmail read-only)
- Click **Continue** / **Allow**

**Say (optional):**
> Google shows the permissions we request. Mail To Story uses gmail.readonly only—we never send, edit, or delete email.

---

### 4. Inbox after login (1:45 – 2:15)

**Show:** https://mailtostory.com/threads

**Do:**
- Wait for inbox/thread list to load
- Briefly show thread subjects and that data comes from the user’s Gmail

**Say (optional):**
> After authorization, the user sees their Gmail threads. We list threads the user already has in Gmail; nothing is sent on their behalf.

---

### 5. Open a thread and generate a story (2:15 – 3:30)

**Show:** Split inbox + story panel

**Do:**
- Click one thread with several messages (a conversation, not a single line)
- Show thread preview or loading state
- Click to **generate** or wait for the **story/digest** to appear
- Scroll through:
  - **Story / narrative** section
  - **Timeline** (if visible)
  - **Actions** (if visible)
- Click a **link to original Gmail message** (if shown) to prove traceability back to source mail

**Say (optional):**
> The user opens a thread they care about. Mail To Story reads that thread on demand and produces a structured summary. This is the core feature that requires gmail.readonly.

---

### 6. Export (3:30 – 4:00)

**Show:** Export controls on the story view

**Do:**
- Export as **Markdown**, **PDF**, or **Word** (any one is enough)
- Show the downloaded file or preview opening

**Say (optional):**
> Users can export summaries for their own use. Exports contain generated summaries, not bulk Gmail data harvesting.

---

### 7. In-app privacy access (4:00 – 4:20)

**Show:** Top-right account menu

**Do:**
- Click profile / account icon
- Show **Privacy Policy** and **Terms of Service** links in the menu

**Say (optional):**
> Privacy policy and terms are also available inside the app after sign-in.

---

### 8. Revoke access (optional but recommended) (4:20 – 4:50)

**Show:** https://myaccount.google.com/permissions

**Do:**
- Find **Mail To Story** in Third-party apps
- Show that the user can **Remove access** (you don’t have to actually remove it)

**Say (optional):**
> Users can revoke Mail To Story’s access anytime in Google Account settings.

---

### 9. Closing frame (4:50 – 5:00)

**Show:** Homepage or privacy policy URL in the address bar

**Say (optional):**
> Mail To Story uses Gmail read-only access solely to display and summarize threads the user chooses to open. Thank you.

---

## Submission checklist

When pasting the video link in the verification form, include this text:

**App:** Mail To Story — https://mailtostory.com  
**Sensitive scope:** `https://www.googleapis.com/auth/gmail.readonly`  
**Video demonstrates:** Homepage + privacy policy link → Google OAuth sign-in → consent screen → inbox → open thread → AI story summary → export → in-app privacy links → (optional) revoke in Google Account settings.

**Scope justification (paste if asked):**

> Mail To Story is a reading tool that turns long Gmail threads into structured stories, timelines, and action lists. Users sign in with Google and explicitly open threads they want summarized. We request gmail.readonly only—no send, modify, or delete. Email content is fetched on demand when the user opens a thread, sent to Google Gemini for on-request summarization, and shown to the signed-in user. Raw Gmail message bodies are not stored in our database; we cache generated summaries and OAuth tokens needed to maintain the session. See https://mailtostory.com/privacy

---

## Common mistakes to avoid

| Don’t | Do instead |
|-------|------------|
| Skip the OAuth consent screen | Pause on it so scopes are readable |
| Use only a login page | Start on homepage with product description |
| Show a blank or error state | Use an account with real threads |
| Rush through story generation | Let the full story/timeline render |
| Forget privacy policy | Show footer link **and** open the page |
| Submit a private YouTube video reviewers can’t open | Use **Unlisted** or Drive “anyone with link” |

---

## Recording tools (pick one)

- **macOS:** QuickTime → File → New Screen Recording, or Cmd+Shift+5
- **Windows:** Xbox Game Bar (Win+G) or OBS
- **Chrome:** Loom extension (free tier works)

No fancy editing required—a single continuous take is fine if all steps are visible.
