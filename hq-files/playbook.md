# Nightly Playbook — Ghosttt Outreach HQ

> This is Claude's memory across nights. Read this first every night. Keep under 300 lines.

## What Night Is This?
Night 2 of operations. Started: 2026-10-27. Last round run: 202 (2026-10-27).

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
- Downtown Greenville Partnership directory (downtowngreenville.com /eat /shop /services /nightlife): 54 business sites, 20 with an email on their own site (r200). Best yield so far. Try the same for other downtown associations.
- Downtown New Bern (downtownnewbern.com /eat-drink /shop + visitnewbern.com /eat-drink/downtown /where-to-shop): 34 sites, 12 with email (r201). Downtown directories are the best source so far.
- Downtown Morehead City (downtownmoreheadcity.com /directory /dine /shop, Wix but links are in the HTML): 39 sites, 16 with email (r202). Elizabeth City (elizabethcitydowntown.com/business-list) and Goldsboro (downtowngoldsboro.com) are Wix with JS-loaded lists: need Chrome.
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

## Lessons
- ECU and similar institution public pages are great for finding local business emails
- Direct page fetching beats web search for finding contact emails
- Keep Shorts to 28–35 seconds — the voice output + slides run longer than you'd expect
- Different visual styles per video: vary bg color and accent color each night
- The Pillow + ffmpeg pipeline works well: render PNG slides, generate aiff audio, concat
- curl + grep on an agency's homepage/contact page is the fastest email check; most eastern NC agency sites (17blue, QuistBuilder, New Bern Web Design) hide email behind forms, so skip them
- Eastern NC lead sources that yield 0 emails (skip): chamber GrowthZone /list pages, visitwilsonnc/visitkinston (JS or 403), bakery sites in Goldsboro, Carteret preferred-caterer PDF (scanned image, 2018), web searches for "@gmail.com"
- Tarboro/Rocky Mount: discoveredgecombe GrowthZone member pages show websites but no emails; rockymountevents.com catering pages list no outside caterers; Zola/WeddingWire hide emails. Skip these without Chrome.
- downtownwashingtonnc.com is behind Cloudflare (blocked), downtownbeaufort.com is empty, downtownrockymount.com 403, wilsondowntown.com is an apartment site (r202)
- downtownwilson.org and downtowngoldsboro.org don't resolve, originalwashington.com fails SSL (r201). Try other domains for them via search.
- downtownkinston.com has no business directory (404); swansboro-nc.org is the town gov site. visitedenton.com lists works well (r203)
- Town gov sites with a /business-directory page (townoforiental.com) are gold: one fetch gives 60 outbound business links (r204)
- Webflow chamber sites (pamlicochamber.com/members) serve every member page to curl; fetch all in parallel, then grep each member's own site (r205)
- Dead ends r206: visitperquimans.com (Wix, only 2 biz sites, no emails on them), visitplymouthnc.com 403, townofhertford/perquimanschamber/plymouthnc/townofmanteo/downtownmanteo don't resolve or 403. Next try windsornc.com (35 outbound links)
- windsornc.com has no business directory (r207): /things-to-do only links 4 nonprofits, other directory paths 404. Skip Windsor.
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

**Rounds 197-199 (done):** 26 agencies staged (goal met), run-all.sh built, gbp-offer.md written; Tarboro prospects Ginger's Boutique + Kwalitstuff have dead sites (need email via Facebook).

**Rounds 200-203 (done):** downtown Greenville (20), New Bern (12), Morehead City (16), Edenton (6) leads staged via directory pages + curl of own sites.

**Round 204 (done):** Chrome not connected, no API_KEY. Oriental via townoforiental.com/business-directory (links to ~60 sites): 17 leads staged in hq-files/add-leads-r204.sh (restaurant, coffee, 2 B&Bs, 3 lodging, 3 marinas, boat yard/services, charter, realty, spa, barber, contractor, yacht broker; emails from own sites). Skipped Baldheaded Bobby (only email was the web designer's) and Sail Loft Rentals (same firm as Sail Loft Realty). Added to run-all.sh. Staged total: ~91 local + 26 agencies.

**Round 205 (done):** Chrome not connected, no API_KEY. Pamlico County via pamlicochamber.com/members (129 member pages, Webflow, plain curl works): 11 leads staged in hq-files/add-leads-r205.sh (pharmacy, florist, law firm, insurance, 2 realty, brewery, pest control, appliance store, 2 marinas; Bayboro/Merritt/Minnesott Beach/Oriental/New Bern; emails from own sites). Skipped r204 dupes, gov/schools/chains, Black Sheep Signs (email domain differs from site). 5 members have NO website (Daily Bread Christian Bookstore, Delamar & Delamar, Diversified Auto & Tire, Flockhart Grocery, Brinson Hauling) = best new-site prospects once an email turns up via Facebook. Staged total: ~102 local + 26 agencies.

**Round 206 (done, no new leads):** Hertford/Plymouth/Manteo sources were dead ends (see Lessons). Staged total unchanged: ~102 local + 26 agencies.

**Rounds 207-208 (blocked):** API_KEY was rejected (401) in r207 and was EMPTY in r208, so no run-all, replies check or approvals. Ghost must save the real key in ~/.autopilot-env (README line ~272). r207: windsornc.com dead end. r208: outerbanks.org/restaurants returns a 388-byte bot block to curl, so skip it; try Dare County chamber (outerbankschamber.com) member pages instead.

**Round 209 (short, 11 min; API_KEY still empty):** outerbankschamber.com works with plain curl (716 members). Use category pages: `/directory/index.php?src=membership&srctype=membership_lister&view=add_info&query=add_info.Business%20Category.eq.<Category>` (e.g. Builders %26 Contractors, Cleaning Services %26 Maintenance, Home Repairs %26 Maintenance, Marinas %26 Boat Services). The plain lister pages (srctype=lister&pos=N,20,716) don't show member websites, so open detail pages from category pages. No leads staged yet.

**What the next round should do:**
0. If API_KEY is in the env: `bash hq-files/run-all.sh`, then act on /api/brief
1. Check /api/brief for any replies
2. More leads, same method: start with Outer Banks via outerbankschamber.com category pages (see r209) (outerbanks.org blocks curl), Beaufort (beaufortnc.org was 403; try other domains). When Chrome connects: Elizabeth City + Goldsboro Wix directories, and Facebook pages of the 22 New Bern sites without emails.
3. Make 6 more Shorts (scripts 13-14 + 4 new original topics, different formats from prev nights)
4. When Chrome connects: check Facebook pages of Ginger's Boutique + Kwalitstuff (Tarboro) for an email, then send the gbp-offer.md email
5. Build free website speed/mobile check page (idea bank #5)
6. Test Gumroad listing if Chrome is connected
