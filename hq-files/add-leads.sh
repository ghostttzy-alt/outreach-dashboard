#!/bin/bash
# Add Night 1 leads via the API.
# Usage: API_KEY=your_key SITE=https://ghostzy.netlify.app bash hq-files/add-leads.sh
#
# SITE defaults to https://ghostzy.netlify.app
# Run this AFTER the push and deploy succeeds.

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"

if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  echo "Example: API_KEY=your_key bash hq-files/add-leads.sh"
  exit 1
fi

api() {
  curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" "$@"
}

echo "Adding leads to $SITE..."

# ============================================================
# LOCAL BUSINESSES — Downtown Ayden, NC (from public directory)
# Emails are blank — look up on their website or Google Business
# ============================================================

api -X POST "$SITE/api/leads" -d '{
  "businessName": "2nd Street Cafe",
  "niche": "Restaurant",
  "city": "Ayden, NC",
  "phone": "(252) 712-4051",
  "website": "",
  "websiteStatus": "None",
  "source": "Downtown Ayden Directory",
  "sourceUrl": "https://downtown-ayden-inc.locable.com/directory/",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Doghouse Tavern",
  "niche": "Bar & Grill",
  "city": "Ayden, NC",
  "phone": "(252) 304-9189",
  "website": "",
  "websiteStatus": "None",
  "source": "Downtown Ayden Directory",
  "sourceUrl": "https://downtown-ayden-inc.locable.com/directory/",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Gwendy'\''s Cafe and Bakery",
  "niche": "Cafe & Bakery",
  "city": "Ayden, NC",
  "phone": "(252) 414-8716",
  "website": "",
  "websiteStatus": "None",
  "source": "Downtown Ayden Directory",
  "sourceUrl": "https://downtown-ayden-inc.locable.com/directory/",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "The Hometown Salon",
  "niche": "Hair Salon",
  "city": "Ayden, NC",
  "phone": "(252) 481-7507",
  "website": "",
  "websiteStatus": "None",
  "source": "Downtown Ayden Directory",
  "sourceUrl": "https://downtown-ayden-inc.locable.com/directory/",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Coltrain Hardware and Garden Center",
  "niche": "Hardware",
  "city": "Ayden, NC",
  "phone": "(252) 304-2153",
  "website": "",
  "websiteStatus": "None",
  "source": "Downtown Ayden Directory",
  "sourceUrl": "https://downtown-ayden-inc.locable.com/directory/",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Carolina Heating & Air Conditioning",
  "niche": "HVAC",
  "city": "Ayden, NC",
  "website": "",
  "websiteStatus": "None",
  "source": "Web search",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Southeast Heating & Air Conditioning",
  "niche": "HVAC",
  "city": "Kinston, NC",
  "phone": "(252) 523-0000",
  "website": "",
  "websiteStatus": "None",
  "source": "Web search",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

# ============================================================
# AGENCIES — confirmed emails from their own sites
# ============================================================

# Add as leads in niche "Marketing agency"
api -X POST "$SITE/api/leads" -d '{
  "businessName": "LT Web Designs",
  "niche": "Marketing agency",
  "city": "Enfield, NC",
  "email": "lisa@ltwebdesigns.com",
  "phone": "(252) 883-2504",
  "website": "ltwebdesigns.com",
  "websiteStatus": "OK",
  "mainProblem": "small NC web design agency — potential buyer of local lead lists",
  "source": "Web search",
  "sourceUrl": "https://ltwebdesigns.com",
  "createdBy": "overnight-session",
  "runId": "2026-10-27-night1"
}'
echo ""

echo "Done. Check the dashboard for results."
echo ""
echo "NEXT STEPS:"
echo "1. For businesses without emails: search Google for each business name + city to find their email"
echo "2. Once emails are added, the daily session will write their first outreach emails"
echo "3. For agencies: their emails are already set — the session will write agency intro emails"
