# Outreach Dashboard

A local dashboard for running a web design outreach business: find small local businesses with no website (or a bad one), email them, send free homepage mockups, and turn them into clients. One place to track every company, every email and every site.

Next.js (App Router) · TypeScript · Tailwind CSS · SQLite + Prisma. Everything runs on your machine; no external services.

## Setup

Requires **Node.js 20+**.

```bash
npm install          # also generates the Prisma client
cp .env.example .env # DATABASE_URL="file:./dev.db"
npm run setup        # creates prisma/dev.db and loads 15 sample leads
npm run dev
```

Open http://localhost:3000.

### Database scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | Create/update the database schema and seed sample data |
| `npm run db:seed` | Load the 15 sample leads (refuses if leads already exist; add `-- --force` to override) |
| `npm run db:clear` | Shows what would be deleted. Run `npm run db:clear -- --yes` to delete all leads, emails, sites, clients, activity and coverage. Settings and templates are kept. |
| `npm run db:reset` | Clear everything and re-seed the samples |
| `npm run db:push` | Apply `prisma/schema.prisma` changes to the database |
| `npm run db:studio` | Browse the raw data in Prisma Studio |

When you're ready to use it for real: edit **Settings** (your name, business, mailing address, sending email, pricing, ramp start date), then run `npm run db:clear -- --yes`.

### Production build

```bash
npm run build && npm start
```

## Pages

- **Overview**: KPIs (leads, sent today vs. limit, reply rate, interested, mockups, clients, revenue, bounce rate), 30-day emails/replies chart, pipeline funnel, a "needs attention" panel (replies waiting, follow-ups due, interested leads with no mockup) and recent activity.
- **Leads**: table with search, filters, sorting, pagination and bulk actions (change stage, export CSV, delete), or a Kanban board where you drag cards between stages. CSV import with column mapping, and manual add.
- **Lead detail**: inline-editable company info, email timeline (sent / opened / replied / bounced), notes, mockup link with preview, quick buttons for Interested / Won / Do Not Contact.
- **Outreach**: today's queue (drafts ready, follow-ups due, queued leads that need a first email), daily send limit with the deliverability ramp, bounce rate and unsubscribes, and the email templates library.
- **Sites & mockups**: card grid of every mockup and client site.
- **Clients**: won clients with editable pricing, start date and status; one-time and monthly recurring totals.
- **Coverage**: city × niche grid of what you've already searched and when; warns when you're about to repeat a search.
- **Settings**: your details, pricing defaults, daily limit, ramp start date, follow-up timing.

Search from anywhere with the top bar (`⌘K` or `/`). Dark mode is the default; the sun/moon button switches themes.

## How the pipeline rules work

The app doesn't send email itself. Write an email from a template, copy it or click **Open in mail app**, then **Mark as sent** to log it. Logging emails drives the pipeline automatically (through the UI or the API):

- An outbound email with a status other than `draft` sets `dateContacted` (if empty) and moves the lead **forward** only: `first` → Contacted, `followup1` → Follow-up 1, `followup2` → Follow-up 2, `mockup` → Mockup Sent.
- An inbound email moves the lead to Replied (if it's earlier in the funnel) and marks your earlier outbound emails as `replied`.
- An email with status `unsubscribed` moves the lead to **Do Not Contact**.
- Setting a lead's stage to **Won** creates a client record using your default pricing from Settings.
- Setting a `mockupUrl` on a lead adds it to Sites & mockups.
- **Do Not Contact** leads are flagged in red everywhere, never appear in the outreach queue, and any outbound email for them is rejected with `403`.
- Follow-ups are due when a lead in Contacted (or Follow-up 1) has had no reply for `followup1Days` (or `followup2Days`) since your last email.
- Daily limit = ramp for the current week since the ramp start date (week 1: 20, week 2: 30, week 3: 40, week 4+: 50), capped by the max daily limit in Settings. The UI warns when you reach or exceed it, and bounce rate turns red above 5%.
- Every delete in the UI asks for confirmation first.

## REST API

Base URL: `http://localhost:3000/api`. JSON in, JSON out. Responses are `{ "data": ... }`; errors are `{ "error": "message" }` with a 4xx status. Unknown fields are ignored and enum fields are validated.

**Allowed values**

| Field | Values |
| --- | --- |
| `Lead.stage` | `Queued`, `Contacted`, `Follow-up 1`, `Follow-up 2`, `Replied`, `Interested`, `Mockup Sent`, `Won`, `Lost`, `Cold`, `Do Not Contact` |
| `Lead.websiteStatus` | `None`, `Broken`, `Not Mobile`, `Outdated`, `No HTTPS`, `OK` |
| `Lead.score` | `1`–`5` |
| `Email.direction` | `outbound`, `inbound` |
| `Email.type` | `first`, `followup1`, `followup2`, `reply`, `mockup` |
| `Email.status` | `draft`, `sent`, `opened`, `replied`, `bounced`, `unsubscribed` |
| `Site.type` / `Site.status` | `mockup`, `client` / `Mockup`, `In Progress`, `Live` |
| `Client.status` | `active`, `paused`, `cancelled` |

Dates are ISO 8601 strings.

### Leads

```bash
# List (all query params optional)
#   q: text search · stage, niche, city, websiteStatus: comma-separated lists
#   minScore, maxScore · sort: businessName|niche|city|score|stage|dateContacted|updatedAt|createdAt|...
#   order: asc|desc · page (default 1) · pageSize (default 25, max 500)
curl "http://localhost:3000/api/leads?stage=Queued,Contacted&city=Austin,%20TX&minScore=4&sort=score&order=desc"

# Create (businessName required)
curl -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d '{
  "businessName": "Lakeside Auto Body", "niche": "Auto body", "city": "Austin, TX",
  "contactName": "Sam Ortiz", "email": "sam@lakesideauto.com", "phone": "(512) 555-0100",
  "website": "lakesideauto.com", "websiteStatus": "Not Mobile",
  "mainProblem": "site is unreadable on phones", "score": 4
}'

# Get one (includes emails, sites, client and recent activity)
curl http://localhost:3000/api/leads/LEAD_ID

# Update any fields, e.g. change stage
curl -X PATCH http://localhost:3000/api/leads/LEAD_ID -H "Content-Type: application/json" -d '{"stage": "Interested"}'

# Delete (also deletes its emails, sites, client record and activity)
curl -X DELETE http://localhost:3000/api/leads/LEAD_ID

# Bulk: change stage, or delete
curl -X POST http://localhost:3000/api/leads/bulk -H "Content-Type: application/json" -d '{"ids": ["ID1","ID2"], "action": "stage", "stage": "Cold"}'
curl -X POST http://localhost:3000/api/leads/bulk -H "Content-Type: application/json" -d '{"ids": ["ID1","ID2"], "action": "delete"}'
```

### Emails

```bash
# List: filter by leadId, status, direction, type; limit (default 500)
curl "http://localhost:3000/api/emails?leadId=LEAD_ID"

# Log an email you sent (advances the stage, logs activity). sentAt defaults to now.
curl -X POST http://localhost:3000/api/emails -H "Content-Type: application/json" -d '{
  "leadId": "LEAD_ID", "direction": "outbound", "type": "first", "status": "sent",
  "subject": "Quick idea for Lakeside Auto Body", "body": "Hi Sam, ..."
}'

# Save a draft for the outreach queue
curl -X POST http://localhost:3000/api/emails -H "Content-Type: application/json" -d '{"leadId": "LEAD_ID", "type": "first", "status": "draft", "subject": "...", "body": "..."}'

# Log a reply you received (moves lead to Replied)
curl -X POST http://localhost:3000/api/emails -H "Content-Type: application/json" -d '{"leadId": "LEAD_ID", "direction": "inbound", "type": "reply", "subject": "Re: Quick idea", "body": "Sure, send it over"}'

# Update status: send a draft, mark opened, bounced, or unsubscribed
curl -X PATCH http://localhost:3000/api/emails/EMAIL_ID -H "Content-Type: application/json" -d '{"status": "bounced"}'

curl http://localhost:3000/api/emails/EMAIL_ID
curl -X DELETE http://localhost:3000/api/emails/EMAIL_ID
```

### Sites, clients, coverage, activity, templates

These all follow the same pattern: `GET /api/<resource>` (with optional filters), `POST /api/<resource>`, `GET|PATCH|DELETE /api/<resource>/<id>`.

| Resource | Required on create | List filters |
| --- | --- | --- |
| `sites` | `leadId` (+ `type`, `status`, `previewUrl`, `liveUrl`, `thumbnailUrl`) | `leadId`, `type`, `status` |
| `clients` | `leadId` (+ `setupPrice`, `monthlyFee`, `startDate`, `status`) | `leadId`, `status` |
| `coverage` | `city`, `niche` (+ `searchedAt`, `leadsFound`) | `city`, `niche` |
| `activities` | `type`, `description` (+ `leadId`) | `leadId`, `type` |
| `templates` | `key`, `name`, `subject`, `body` | `key` |

```bash
curl -X POST http://localhost:3000/api/sites -H "Content-Type: application/json" -d '{"leadId": "LEAD_ID", "type": "mockup", "status": "Mockup", "previewUrl": "https://mockups.example.com/lakeside"}'
curl -X PATCH http://localhost:3000/api/sites/SITE_ID -H "Content-Type: application/json" -d '{"type": "client", "status": "Live", "liveUrl": "https://lakesideauto.com"}'

curl -X POST http://localhost:3000/api/clients -H "Content-Type: application/json" -d '{"leadId": "LEAD_ID", "setupPrice": 750, "monthlyFee": 60, "startDate": "2026-11-01"}'
curl -X PATCH http://localhost:3000/api/clients/CLIENT_ID -H "Content-Type: application/json" -d '{"status": "paused"}'
curl "http://localhost:3000/api/clients?status=active"

curl -X POST http://localhost:3000/api/coverage -H "Content-Type: application/json" -d '{"city": "Austin, TX", "niche": "Auto body", "leadsFound": 6}'
curl "http://localhost:3000/api/coverage?city=Austin,%20TX&niche=Auto%20body"

curl -X POST http://localhost:3000/api/activities -H "Content-Type: application/json" -d '{"leadId": "LEAD_ID", "type": "note", "description": "Called, left voicemail"}'
curl "http://localhost:3000/api/activities?leadId=LEAD_ID"

curl http://localhost:3000/api/templates
curl -X PATCH http://localhost:3000/api/templates/TEMPLATE_ID -H "Content-Type: application/json" -d '{"subject": "A quick idea for {business_name}"}'
```

Template variables: `{business_name}`, `{first_name}`, `{problem}`, `{city}`, `{niche}`, `{website}`, `{mockup_url}`, `{my_name}`, `{my_business}`, `{mailing_address}`.

### Settings and stats

```bash
curl http://localhost:3000/api/settings   # includes the current ramp week and limit
curl -X PATCH http://localhost:3000/api/settings -H "Content-Type: application/json" -d '{"yourName": "Your Name", "dailyLimit": 50, "rampStartDate": "2026-10-01"}'

# Overview numbers, 30-day series, funnel, sending stats and "needs attention" lists
curl http://localhost:3000/api/stats
```

### CSV import and export

```bash
# Upload a CSV. Columns are matched automatically (e.g. "Company", "Email", "City", "Category").
curl -X POST http://localhost:3000/api/import -F "file=@leads.csv"

# Preview headers and the guessed mapping without saving
curl -X POST "http://localhost:3000/api/import?dryRun=1" -F "file=@leads.csv"

# Explicit mapping: { leadField: "CSV header" }
curl -X POST http://localhost:3000/api/import -F "file=@leads.csv" -F 'mapping={"businessName":"Company","email":"Email","city":"Town","niche":"Category"}'

# Or send JSON rows using lead field names
curl -X POST http://localhost:3000/api/import -H "Content-Type: application/json" -d '{"rows": [{"businessName": "Lakeside Auto Body", "email": "sam@lakesideauto.com", "city": "Austin, TX"}]}'
```

The import returns `{ "imported": n, "duplicates": n, "errors": [...] }`. Rows whose email already exists are skipped. Missing stage defaults to Queued; missing website status is `OK` when there's a website and `None` otherwise.

```bash
curl -o leads.csv http://localhost:3000/api/export                     # all leads
curl -o queued.csv "http://localhost:3000/api/export?stage=Queued"      # same filters as GET /api/leads
curl -o some.csv "http://localhost:3000/api/export?ids=ID1,ID2"        # specific leads
```

## Project layout

```
prisma/schema.prisma      data model
prisma/seed.ts, clear.ts  sample data and the clear script
src/app/api/              REST routes
src/app/                  pages (overview, leads, outreach, sites, clients, coverage, settings)
src/lib/services.ts       pipeline rules (stage changes, Do Not Contact lock, client creation)
src/lib/metrics.ts        overview numbers, follow-ups due, needs attention
src/components/           UI
```
