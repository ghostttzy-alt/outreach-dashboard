# Outreach Dashboard

The backend of an automated cold-email outreach system for a web design business. It stores leads, shows the dashboard, sends email through Gmail, and checks Gmail for replies.

**No AI runs here.** Finding leads, writing emails, classifying replies and building mockups is done by a separate daily Claude Code session that talks to this site through the API below. Nothing is emailed until you approve it in the **Approval queue**.

Next.js (App Router) · TypeScript · Tailwind CSS · Prisma + Postgres (Neon or Supabase) · Gmail API · Netlify (with scheduled functions).

```
daily Claude session ──GET /api/brief──▶ this site ◀── you (dashboard, approve emails)
        │                                   │
        └─POST leads / drafts / classify ──▶│── every 2 min: send 1 approved email via Gmail
                                            └── every 30 min: check Gmail for replies & bounces
```

## Contents

- [Going live (Netlify)](#going-live-netlify)
- [How it works](#how-it-works)
- [API for the daily session](#api-for-the-daily-session)
- [Local development](#local-development)

## Going live (Netlify)

Environment variables (Netlify → Site configuration → Environment variables):

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string from Neon (or Supabase). Tables are created automatically on deploy. |
| `DASHBOARD_PASSWORD` | yes | Your first sign-in password. It's stored as a scrypt hash on first sign-in; change it later in Settings. |
| `API_KEY` | yes | A long random string. The daily session sends it as `x-api-key`. |
| `GOOGLE_CLIENT_ID` | for sending | From Google Cloud → Credentials (OAuth client, "Web application"). |
| `GOOGLE_CLIENT_SECRET` | for sending | Same place. Also used to encrypt the saved Gmail tokens. |
| `SESSION_SECRET` | optional | Signs sign-in cookies. Defaults to a key derived from `DATABASE_URL`. |
| `ENCRYPTION_KEY` | optional | Encrypts Gmail tokens. Defaults to a key derived from `GOOGLE_CLIENT_SECRET`. |
| `APP_URL` | optional | Public URL used in mockup links, e.g. `https://ghostzy.netlify.app`. Defaults to the URL the API is called on. |
| `PASSWORD_RESET` | recovery only | Set to `true` together with a new `DASHBOARD_PASSWORD` to reset a forgotten password; remove it afterwards. |

The Netlify build runs `npm run db:deploy && npm run build`. `db:deploy` applies the migrations in `prisma/migrations` (Neon's `-pooler` host is swapped for the direct host automatically for migrations, or set `DIRECT_URL`). If `DATABASE_URL` is missing the build stops and Netlify keeps the previous version live.

**Gmail:** in Google Cloud, create a project, enable the Gmail API, set up the OAuth consent screen (External, Testing, add yourself as a test user, scopes `gmail.send` and `gmail.readonly`), then create an OAuth client of type *Web application* with the redirect URI shown in **Settings → Gmail** (`https://<your-site>/api/gmail/callback`). Put the client ID and secret in Netlify, redeploy, and press **Connect Gmail**.

> While the Google app is in *Testing*, Google expires the connection after 7 days. The dashboard shows a red "Gmail disconnected" alert and you press **Reconnect Gmail**. To avoid the weekly reconnect, press **Publish app** on the consent screen page (you'll see an "unverified app" warning when connecting; click *Advanced → Go to …*).

**Scheduled functions** live in `netlify/functions/`: `send-tick` (every 2 minutes) and `check-replies` (every 30 minutes). They only run on the published production deploy. Each calls the site's `/api/cron/*` route with a secret derived from the server secret, so they need no extra setup.

## How it works

### Pages

- **Overview**: red alerts (paused, bounce rate above 5%, Gmail disconnected, reply checking failing), a "Ready to approve: X emails" banner, a **Needs you** panel (replies the daily session flagged, unanswered questions, replies left unclassified for a day), KPIs, 30-day chart, funnel, what the daily session will pick up next, recent activity.
- **Approval queue**: every pending draft with recipient, subject and the full body exactly as it will be sent (including the footer that's added automatically). Edit, remove, approve one, or **Approve all**. Below: approved emails waiting to send (unapprove), and failed ones (retry).
- **Leads** (table and Kanban), **Lead detail** (timeline with reply categories you can change, follow-up schedule, source), **Outreach** (limits, ramp, deliverability, pipeline), **Sites & mockups**, **Clients**, **Coverage**.
- **Runs**: each daily session's report (counts, notes, errors).
- **Settings**: name, business, mailing address, sending email, pricing, daily limit, ramp per week, ramp start date, time zone and sending hours, target cities, target niches, chain/franchise blocklist, follow-up timing, **Pause all outreach**, Gmail connection, password, Do Not Contact list.

Every page and every `/api` route requires sign-in or the API key. The only public paths are `/login` and `/preview/{slug}` (mockups).

### Sending rules

- Drafts (`status: draft`) do nothing until approved. Approved emails are sent **one at a time** by the 2-minute scheduler, with a **random 2–6 minute gap** between sends, only inside your sending hours (and on weekdays unless weekends are enabled).
- Order: replies and mockup emails first, then follow-up 2, follow-up 1, then first emails.
- **Daily limit** = ramp for the current week since the ramp start date (default week 1: 20, week 2: 30, week 3: 40, week 4+: 50), capped by the max daily limit. Everything sent counts, follow-ups included. The day is counted in your time zone. It is never exceeded: whatever doesn't fit goes out on the next sending day.
- **Do Not Contact** is checked when a lead is created, when a draft is added, when it's approved, and again right before every send. A blocked email is cancelled, never sent.
- Follow-ups and replies go into the **same Gmail thread** (`threadId`, `In-Reply-To`, `References`) with the subject "Re: <first subject>".
- First emails and follow-ups get your business name + mailing address and an unsubscribe line appended if the draft doesn't already include them, plus a `List-Unsubscribe` header.
- **Auto-pause**: when a new bounce pushes the 7-day bounce rate above 5%, "Pause all outreach" switches on with the reason, and the overview shows a red alert.
- Every sent email is logged on the lead's timeline and moves the lead forward (first → Contacted, follow-up 1 → Follow-up 1, follow-up 2 → Follow-up 2, mockup → Mockup Sent).

### Reply rules (no AI)

Every 30 minutes the server looks at new Gmail messages on threads it started (and bounce notices):

- New replies are saved on the lead's timeline as **Unclassified**. Any reply **stops the follow-up sequence** and cancels pending follow-ups.
- **Bounces** (mailer-daemon / delivery failure): the sent email is marked bounced, the lead becomes **Lost**, and it counts toward the bounce rate.
- **Obvious opt-outs** in the new text of the reply (quoted history is ignored): "unsubscribe", "remove me", "not interested", "no thanks", "please stop" / "stop emailing", or a short message containing "stop" → **Do Not Contact** immediately, all pending emails cancelled.
- Messages with an `Auto-Submitted` header (out-of-office) are classified **Auto-reply** automatically.

When a reply is classified (by the daily session or on the lead page):

| Category | What happens |
| --- | --- |
| Interested | Stage → Interested |
| Question | Stage → Replied |
| Not now | Stage → Cold |
| Not interested / Unsubscribe | Do Not Contact, pending emails cancelled |
| Auto-reply | Follow-ups restart: the next one is due in 5 days |
| Bounce | Lead → Lost, counts toward bounce rate |

### Follow-up timing (no AI)

- First email sent → **follow-up 1 due 4 days later**; follow-up 1 sent → **follow-up 2 due 5 days later**; follow-up 2 sent → **marked Cold 5 days later** if there's still no reply. (All configurable in Settings; due dates fall at the start of the day in your time zone.)
- Due follow-ups appear in `/api/brief` so the daily session writes them; they go through the Approval queue like everything else. A follow-up approved early waits until it's due.

## API for the daily session

Base URL: `https://ghostzy.netlify.app/api`. Send `x-api-key: $API_KEY` on every request. JSON in, JSON out. Success is `{ "data": ... }` (bulk endpoints return a summary); errors are `{ "error": "message" }` with a 4xx status.

```bash
export SITE=https://ghostzy.netlify.app
export API_KEY=your-api-key
alias api='curl -sS -H "x-api-key: $API_KEY" -H "Content-Type: application/json"'
```

### `GET /api/brief`: everything for today in one call

```bash
api "$SITE/api/brief"
```

Returns:

| Field | Contents |
| --- | --- |
| `settings` | Your name, business, mailing address, sending email, pricing, limits, ramp, time zone, sending window, target cities and niches, chain blocklist, follow-up days, pause state |
| `sending` | `paused`, `gmailConnected`, `rampWeek`, `todayLimit`, `sentToday`, `approvedWaiting`, `awaitingApproval`, **`remainingSlots`** (how many new emails are worth writing today), `blockers` |
| `deliverability` | `sent7d`, `bounced7d`, `bounceRate7d`, `pauseThresholdPct` |
| `unansweredReplies[]` | `replyId`, `category`, `receivedAt`, `subject`, `text` (new text only), `fullText`, `needsYou`, `lead` (full info), `thread[]` (the whole conversation) |
| `followUpsDue[]` | `leadId`, `type` (`followup1`/`followup2`), `dueDate`, `overdueDays`, `lead`, `previousEmails[]` (subject, body, sentAt) |
| `interestedNeedingMockups[]` | `leadId`, `lead`, `lastReply` |
| `leadsReadyForFirstEmail[]` | Queued leads that have an email but no email written yet (often ones you just filled in). Write their first email before finding new leads |
| `leadsNeedingEmail[]` | Queued leads saved without an email. They show on the Overview under "Find an email" for you to look up |
| `recentCoverage[]` | City + niche combos searched in the last 30 days: `city`, `niche`, `lastSearchedAt`, `timesSearched`, `leadsFound` |
| `leadsByStage`, `lastRun` | Counts per stage; the previous run's summary |

### Leads

```bash
# Duplicate check before adding (any of email, name+city, website)
api "$SITE/api/leads/check?email=joe@joesplumbing.com&name=Joe%27s%20Plumbing&city=Austin,%20TX"
# → { "data": { "ok": false, "duplicate": true, "doNotContact": false, "blockedChain": null, "matches": [ { "id": "...", "matchedOn": ["email"] } ] } }

# Create one lead (businessName required). Audit fields: source, sourceUrl, createdBy, runId.
api -X POST "$SITE/api/leads" -d '{
  "businessName": "Joe'\''s Plumbing", "niche": "Plumber", "city": "Austin, TX",
  "contactName": "Joe Ortiz", "email": "joe@joesplumbing.com", "phone": "(512) 555-0100",
  "website": "joesplumbing.com", "websiteStatus": "Not Mobile", "mainProblem": "site is unreadable on phones",
  "score": 4, "source": "Google Maps", "sourceUrl": "https://maps.google.com/?cid=123", "runId": "2026-10-27"
}'
# 201 → { "data": { lead } }
# 409 duplicate · 403 on the Do Not Contact list · 422 matches the chain blocklist · 400 invalid

# Create many (max 200). Each one is checked; the rest still go in.
api -X POST "$SITE/api/leads" -d '{ "leads": [ { "businessName": "A", "email": "a@a.com" }, { "businessName": "B", "city": "Dallas, TX" } ] }'
# → { "created": 2, "rejected": 0, "results": [ { "ok": true, "id": "..." }, { "ok": false, "reason": "duplicate", "error": "..." } ] }

# Update stage, notes, problem, score, mockup link (any lead field)
api -X PATCH "$SITE/api/leads/LEAD_ID" -d '{ "stage": "Interested", "notes": "Wants booking", "problem": "no online booking", "score": 5, "mockupUrl": "https://..." }'

# Read one lead with its emails, sites and activity; list with filters
api "$SITE/api/leads/LEAD_ID"
api "$SITE/api/leads?stage=Queued&city=Austin,%20TX&pageSize=100"
```

Duplicates are: same email, same business name + city (ignoring case, punctuation and "LLC/Inc"), or same website domain.

### Drafts (Approval queue)

```bash
# Add one draft. type: first | followup1 | followup2 | reply | mockup
api -X POST "$SITE/api/drafts" -d '{ "leadId": "LEAD_ID", "type": "first", "subject": "Quick idea for Joe'\''s Plumbing", "body": "Hi Joe,\n\n..." }'

# Add many (max 200)
api -X POST "$SITE/api/drafts" -d '{ "drafts": [
  { "leadId": "LEAD_1", "type": "first", "subject": "...", "body": "..." },
  { "leadId": "LEAD_2", "type": "followup1", "body": "Just floating this back up..." }
] }'
# → { "created": 2, "rejected": 0, "results": [ { "ok": true, "id": "..." }, ... ] }

# List: status=draft (default) | approved | failed | cancelled
api "$SITE/api/drafts?status=draft"
```

Rules: `subject` is required for `first` (follow-ups and replies reuse "Re: <first subject>" so they stay in the thread). Rejected when the lead has no email, is Do Not Contact, already has the same type waiting, already got a first email, or the follow-up isn't the lead's next step. Approving happens on the dashboard (or `POST /api/drafts/approve` with `{ "ids": [...] }` / `{ "all": true }`). `PATCH /api/drafts/:id` edits `subject`/`body` or sets `status` to `draft`, `approved` or `cancelled`; `DELETE /api/drafts/:id` removes an unsent draft.

### Replies

```bash
# Unclassified replies (or any category), with text = the new part of the message
api "$SITE/api/replies?category=Unclassified"

# Classify. category: Interested | Question | Not now | Not interested | Unsubscribe | Bounce | Auto-reply
# Optional: needsYou (true flags it in the dashboard's "Needs you" panel) and note.
api -X POST "$SITE/api/replies/REPLY_ID/classify" -d '{ "category": "Question", "needsYou": true, "note": "Asks about price for a 5-page site" }'

# Clear or set the "Needs you" flag
api -X PATCH "$SITE/api/replies/REPLY_ID" -d '{ "needsYou": false }'
```

### Mockups

```bash
# Save a mockup (HTML up to 2 MB). Optional "slug". Re-posting for the same lead replaces it and keeps the link.
api -X POST "$SITE/api/mockups" -d "$(jq -n --arg html "$(cat mockup.html)" '{leadId: "LEAD_ID", html: $html}')"
# → { "data": { "slug": "joes-plumbing-x7k2", "url": "https://ghostzy.netlify.app/preview/joes-plumbing-x7k2" } }

api "$SITE/api/mockups?leadId=LEAD_ID"
```

The link is saved on the lead (`mockupUrl`) and appears on Sites & mockups. `/preview/{slug}` is public, carries `noindex` (meta tag and `X-Robots-Tag`), shows a small "Free preview by {your business}" footer, and runs sandboxed so its scripts can't reach the dashboard.

### Coverage and runs

```bash
# Log a city + niche you searched
api -X POST "$SITE/api/coverage" -d '{ "city": "Austin, TX", "niche": "Plumber", "leadsFound": 6 }'

# Report the daily run (shown on the Runs page). status defaults to "partial" when errors are present.
api -X POST "$SITE/api/runs" -d '{
  "counts": { "leadsFound": 14, "leadsAdded": 11, "draftsWritten": 18, "repliesClassified": 3, "mockupsBuilt": 1 },
  "notes": "Searched Austin plumbers and roofers. Skipped 3 franchises.",
  "errors": ["Yelp search timed out for Round Rock"]
}'
api "$SITE/api/runs?limit=7"
```

### Do Not Contact

```bash
api "$SITE/api/dnc?email=someone@business.com"           # → { "data": { "doNotContact": true, ... } }
api -X POST "$SITE/api/dnc" -d '{ "email": "someone@business.com", "reason": "Asked by phone" }'
```

The API can add to the list but not remove from it; removing is dashboard-only.

### Other routes

`GET /api/settings`, `PATCH /api/settings` (all Settings fields, e.g. `{ "paused": true }`), `GET /api/stats`, `GET/POST /api/emails`, `GET/POST/PATCH/DELETE /api/sites|clients|coverage|activities|templates[/:id]`, `POST /api/import` (CSV), `GET /api/export` (CSV). `POST /api/cron/send` and `POST /api/cron/replies` run one sending tick / reply check immediately.

### Allowed values

| Field | Values |
| --- | --- |
| `Lead.stage` | `Queued`, `Contacted`, `Follow-up 1`, `Follow-up 2`, `Replied`, `Interested`, `Mockup Sent`, `Won`, `Lost`, `Cold`, `Do Not Contact` |
| `Lead.websiteStatus` | `None`, `Broken`, `Not Mobile`, `Outdated`, `No HTTPS`, `OK` |
| `Lead.score` | `1`–`5` |
| `Email.type` | `first`, `followup1`, `followup2`, `reply`, `mockup` |
| `Email.status` | `draft` (awaiting approval), `approved`, `sending`, `sent`, `opened`, `replied`, `bounced`, `unsubscribed`, `received` (inbound), `cancelled`, `failed` |
| Reply `category` | `Unclassified`, `Interested`, `Question`, `Not now`, `Not interested`, `Unsubscribe`, `Bounce`, `Auto-reply` |

## Local development

Requires Node.js 20+ and a Postgres database (local, or a free Neon branch).

```bash
npm install
cp .env.example .env      # set DATABASE_URL
npx prisma migrate deploy # create the tables
npm run db:seed           # optional: 15 sample leads (refuses to run against a non-local database)
npm run dev
```

Without `DASHBOARD_PASSWORD` locally there is no sign-in. `npm run db:clear -- --yes` removes all leads. After changing `prisma/schema.prisma`, run `npm run db:migrate -- --name what_changed` to create a migration.

```
prisma/schema.prisma        data model            prisma/migrations/   SQL migrations
netlify/functions/          scheduled functions   src/middleware.ts    sign-in + API key check
src/lib/sender.ts           sending, limits, ramp, gaps, send-layer checks
src/lib/replies.ts          reply/bounce checking, opt-out keywords, classification rules
src/lib/followups.ts        follow-up timing and Cold marking
src/lib/brief.ts            GET /api/brief
src/lib/leads.ts, drafts.ts duplicate / Do Not Contact / blocklist checks
src/lib/gmail.ts            Gmail OAuth, sending, reading (REST, no SDK)
```
