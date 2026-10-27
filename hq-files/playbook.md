# Nightly Playbook — Ghosttt Outreach HQ

> This is Claude's memory across nights. Read this first every night. Keep under 300 lines.

## What Night Is This?
Night 2 of operations. Started: 2026-10-27. Last round run: 199 (2026-10-27).

## Channel: college-hacks-for-broke-students
YouTube niche confirmed: "College hacks for broke students" — I'm a college student so it fits. Track views per format and do more of top 2.

## Last Night's Numbers
Night 2 (multiple autopilot rounds):
- Leads added: +20 staged local biz (add-leads-n2.sh) + 24 agencies (add-agencies.sh) — user needs to run
- Emails sent: 0 (no API key set locally; DB connection needed)
- Bounce rate: 0%
- YouTube: 18 new Shorts ready to upload in hq-files/youtube/ready/ (short7–short12 × 2 sets + variants)
- Revenue: $0

Night 1 summary (base):
- HQ, care plan, lead lists, YouTube scripts, admin addon, Etsy PDFs — all done

## What's Working
- YouTube Shorts production: fast with Pillow + ffmpeg + macOS say. Made 6/night.
- ECU catering list: gold mine of Greenville NC business emails (12 confirmed)
- Agency contact pages: ~50% yield on email when fetched directly

## What Isn't Working
- Local server: no .env set up locally, can't access DB or API
- Web search for emails: poor yield; direct page fetching works better
- Deployed API: user hasn't set API_KEY yet, so scripts can't be run

## Running Experiments
| # | What | Built | Status |
|---|------|-------|--------|
| 1 | Care plan page at /care | Yes — live | Running |
| 2 | Etsy listings (3 products) | PDFs made, listing not live | Waiting for Etsy shop |
| 3 | Agency lead list pitch | 26 agencies staged (add-agencies.sh + add-agencies-r197.sh) | Waiting for API key |
| 4 | YouTube Shorts | 24 total (6 N1 + 18 N2) | Waiting for upload |
| 5 | /free resources page | Live | Running |

## Tonight's Priorities (Night 3+)
1. Check /api/brief for any replies or bounces
2. If API key is available: run add-leads-n2.sh, add-leads.sh, add-hq-logs-n2.sh
3. Find 15 more agencies to get to 25+ with real emails
4. Find 20+ more local business leads with emails (try chamber of commerce sites, Yelp pages with emails)
5. Make 6 more Shorts (scripts 8, 10, 13, 14 + 2 new topics)
6. Upload Shorts to YouTube Studio if Chrome is connected
7. Test idea bank ideas: Google Business Profile setup offer, QR code menus, free website speed check

## Lessons
- ECU and similar institution public pages are great for finding local business emails
- Direct page fetching beats web search for finding contact emails
- Keep Shorts to 28–35 seconds — the voice output + slides run longer than you'd expect
- Different visual styles per video: vary bg color and accent color each night
- The Pillow + ffmpeg pipeline works well: render PNG slides, generate aiff audio, concat
- curl + grep on an agency's homepage/contact page is the fastest email check; most eastern NC agency sites (17blue, QuistBuilder, New Bern Web Design) hide email behind forms, so skip them
- Eastern NC lead sources that yield 0 emails (skip): chamber GrowthZone /list pages, visitwilsonnc/visitkinston (JS or 403), bakery sites in Goldsboro, Carteret preferred-caterer PDF (scanned image, 2018), web searches for "@gmail.com"
- Tarboro/Rocky Mount: discoveredgecombe GrowthZone member pages show websites but no emails; rockymountevents.com catering pages list no outside caterers; Zola/WeddingWire hide emails. Skip these without Chrome.
- Only tick YouTube "altered or synthetic content" for realistic fake people/events, not just for an AI voice

## Idea Bank Progress (20 per night)
### Night 1 — Built
1. Care plan landing page (/care) — DONE
2. Admin add-on service menu — DONE
3. College budget planner PDF — DONE
4. Small business invoice kit PDF — DONE
5. Notion student template PDF — DONE
6. Agency lead list pitch template — DONE
7. Lead list CSV export (/api/hq/leads-export) — DONE
8. HQ dashboard (/hq) — DONE
9. 14 YouTube scripts — DONE
10. Care plan upsell paragraph (hq-files/care-plan.md) — DONE

### Night 2 — Built
11. 18 new YouTube Shorts (6 prev-round dark-style + 6 themed Pillow-rendered + 6 more) — DONE
12. 20 new local leads with confirmed emails staged (add-leads-n2.sh) — DONE
13. /free resources page — DONE
14. 24 NC agency leads with real emails + add-agencies.sh script — DONE

### Night 2 — To Do (from idea bank)
15. Google Business Profile setup offer — DONE r199 (hq-files/gbp-offer.md, $75, honest limits, only send when a real profile problem is seen)
16. Free website speed/mobile check email hook
17. NC local business directory page
18. Restaurant menu redesign offer + email template
19. QR code menu service description
20. Find more Kinston/Wilson/Goldsboro leads via chamber sites
21. Social media template pack PDF for Etsy/Gumroad
22. Mini-guide: free AI tools for small business owners
23. New NC businesses from Secretary of State filings

## Where I Am Now (after Night 2 autopilot round)
**Files committed through Night 2 rounds:**
- hq-files/youtube/ready/short7–short12.mp4 (18 new Shorts across multiple styles)
- hq-files/add-leads-n2.sh (20 local leads with confirmed emails)
- hq-files/add-agencies.sh (24 agencies with confirmed emails + draft pitch emails)
- hq-files/add-hq-logs-n2.sh (log entries for Night 2)
- src/app/free/page.tsx (/free resources page, live on Netlify)

**What still needs the user:**
1. Get API key from Netlify → run add-leads.sh + add-leads-n2.sh + add-agencies.sh
2. Upload 18 new Shorts from hq-files/youtube/ready/ to YouTube Studio (schedule 3/day)
3. Open Etsy/Gumroad account → list 3 products from hq-files/etsy/
4. Connect Gmail to dashboard so outreach starts sending

**Round 197 (done):** Chrome not connected, no API_KEY locally. Added hq-files/add-agencies-r197.sh (EZ Marketing info@ezmarketing.com, Emulent bill@emulent.com), so 26 agencies are staged (goal 25+ met, pending user running the scripts). Fixed the "altered content" advice in morning-summary.md.

**Round 198 (done):** Chrome not connected, no API_KEY. Lead hunt in Kinston/Wilson/Goldsboro found 0 new emails (sources listed in Lessons). Added hq-files/run-all.sh: one command that checks the key against /api/brief, runs all 5 staged scripts in order (rerun-safe, the API skips duplicates), then prints the brief. Morning summary now points to it.

**Round 199 (done):** Chrome not connected, no API_KEY. Lead hunt (Rocky Mount Event Center, Edgecombe/Tarboro directory, Zola caterers) found 0 new emails. Found 2 Tarboro shops whose listed websites no longer resolve (NXDOMAIN), good "website rescue" + GBP prospects once an email turns up via Facebook in Chrome: Ginger's Boutique (409 N. Main St, gingersboutiquenc.com dead) and Kwalitstuff (kwalitstuff.com dead). Wrote hq-files/gbp-offer.md.

**What the next round should do:**
0. If API_KEY is in the env: `bash hq-files/run-all.sh`, then act on /api/brief
0b. For leads, try sources not yet tried: Facebook pages via Chrome (when connected), NC Cooperative Extension county farm/vendor guides, church/venue vendor PDFs that have real text
1. Check /api/brief for any replies
2. Find 20+ more eastern NC local business leads with real emails (Kinston, Wilson, Goldsboro, Rocky Mount)
3. Make 6 more Shorts (scripts 13-14 + 4 new original topics — different formats from prev nights)
4. When Chrome connects: check Facebook pages of Ginger's Boutique + Kwalitstuff (Tarboro) for an email, then send the gbp-offer.md email
5. Build free website speed/mobile check page (idea bank #5)
6. Test Gumroad listing if Chrome is connected
