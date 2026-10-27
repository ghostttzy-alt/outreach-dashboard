# Nightly Playbook — Ghosttt Outreach HQ

> This is Claude's memory across nights. Read this first every night. Keep under 300 lines.

## What Night Is This?
Night 2 of operations. Started: 2026-10-27.

## Channel: college-hacks-for-broke-students
YouTube niche confirmed: "College hacks for broke students" — I'm a college student so it fits. Track views per format and do more of top 2.

## Last Night's Numbers
Night 2 (autopilot round 1, 45 min):
- Leads added: +20 staged (12 local biz + 8 agencies in add-leads-n2.sh — user needs to run)
- Emails sent: 0 (no API key set locally; DB connection needed)
- Bounce rate: 0%
- YouTube: 6 new Shorts made and in hq-files/youtube/ready/ (short7–short12)
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
| 3 | Agency lead list pitch | 8 new agencies staged | Waiting for API key |
| 4 | YouTube Shorts | 12 total (6 N1 + 6 N2) | In progress |
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
11. 6 new YouTube Shorts (short7–short12, different styles) — DONE
12. 20 new leads with confirmed emails staged (add-leads-n2.sh) — DONE
13. /free resources page — DONE
14. 8 NC agency leads with confirmed emails — DONE

### Night 2 — To Do (from idea bank)
15. Google Business Profile setup offer — add to email templates
16. Free website speed/mobile check email hook
17. NC local business directory page
18. Restaurant menu redesign offer
19. QR code menu service
20. "Website rescue" for broken sites
21. Social media template pack
22. Mini-guide: free AI tools for small business owners
23. Find 15 more agencies (need 25+ total)
24. New NC businesses from Secretary of State filings

## Where I Am Now (after Night 2 autopilot round)
**Files committed this round:**
- hq-files/youtube/ready/short7–short12.mp4 (6 new Shorts)
- hq-files/add-leads-n2.sh (20 leads with confirmed emails)
- hq-files/add-hq-logs-n2.sh (log entries for Night 2)
- src/app/free/page.tsx (/free resources page, live on Netlify)

**What still needs the user:**
1. Get API key from Netlify → run hq-files/add-leads.sh and hq-files/add-leads-n2.sh
2. Upload all 12 Shorts from hq-files/youtube/ready/ to YouTube Studio
3. Open Etsy/Gumroad account → list 3 products from hq-files/etsy/
4. Connect Gmail to dashboard so outreach starts sending

**What the next round should do:**
1. Check /api/brief for replies
2. Find 15 more agencies (try DesignRush NC, Clutch NC, BrightLocal NC)
3. Find 20+ more local leads via chamber/Yelp/Google pages with emails
4. Make 6 more Shorts (remaining scripts + 2 new formats)
5. Build free website speed check page (idea bank #5)
6. Build Google Business Profile offer email template (idea bank #1)
