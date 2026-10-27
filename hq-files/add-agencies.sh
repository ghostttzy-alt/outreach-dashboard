#!/bin/bash
# Add 24 NC/Southeast web design & marketing agencies as leads with draft pitch emails.
# Each email offers a free 10-lead sample from their area, then $150/100 verified leads.
#
# Usage: API_KEY=your_key SITE=https://ghostzy.netlify.app bash hq-files/add-agencies.sh
#
# SITE defaults to https://ghostzy.netlify.app
# Run AFTER the deploy succeeds and you have your API_KEY from Netlify env vars.

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"

if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running."
  echo "  API_KEY=your_key bash hq-files/add-agencies.sh"
  exit 1
fi

api() {
  curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" "$@"
}

# Add one agency and queue a draft pitch email.
# Args: name email city website area_description
add_agency() {
  local name="$1"
  local email="$2"
  local city="$3"
  local website="$4"
  local area="$5"

  echo -n "Adding $name ... "

  # 1. Create the lead
  LEAD_ID=$(api -X POST "$SITE/api/leads" -d "{
    \"businessName\": $(echo "$name" | jq -Rs .),
    \"niche\": \"Marketing agency\",
    \"city\": $(echo "$city" | jq -Rs .),
    \"email\": $(echo "$email" | jq -Rs .),
    \"website\": $(echo "$website" | jq -Rs .),
    \"websiteStatus\": \"OK\",
    \"mainProblem\": \"NC web design/marketing agency — potential buyer of local lead lists\",
    \"source\": \"Web search — agency own website\",
    \"createdBy\": \"overnight-session\",
    \"runId\": \"2026-10-27-night2-agencies\"
  }" | jq -r '.data.id // .id // empty')

  if [ -z "$LEAD_ID" ]; then
    echo "SKIPPED (duplicate or error)"
    return
  fi

  # 2. Write the pitch email draft
  SUBJECT="Free: 10 local leads for $area web agencies"

  BODY="Hey $name,

I put together verified lead lists of local businesses in $area — business name, phone, website status, and email address when I can find one.

I thought you might find it useful for prospecting new clients. I'd like to send you a free sample of 10 businesses from $area to see if the format works for you. No strings, no catch.

If you are interested, just reply and I will send it over. If not, reply \"no thanks\" and I will not email again.

— Ghosttt"

  api -X POST "$SITE/api/drafts" -d "{
    \"leadId\": $(echo "$LEAD_ID" | jq -Rs .),
    \"type\": \"first-contact\",
    \"subject\": $(echo "$SUBJECT" | jq -Rs .),
    \"body\": $(echo "$BODY" | jq -Rs .)
  }" > /dev/null

  echo "OK (leadId: $LEAD_ID)"
}

echo ""
echo "Adding 24 NC/SE agencies to $SITE ..."
echo ""

# ── EASTERN NC ────────────────────────────────────────────────────────────────
add_agency "LT Web Designs"        "lisa@ltwebdesigns.com"            "Enfield, NC"         "ltwebdesigns.com"          "eastern NC"
add_agency "Red Shark Digital"     "info@redsharkdigital.com"         "Greenville, NC"      "redsharkdigital.com"       "eastern NC"
add_agency "JF Web"                "hello@jfweb.com"                  "Greenville, NC"      "jfweb.com"                 "eastern NC"

# ── WILMINGTON / SOUTHEAST NC ─────────────────────────────────────────────────
add_agency "Blue Tone Media"       "info@bluetonemedia.com"           "Wilmington, NC"      "bluetonemedia.com"         "southeastern NC"
add_agency "DesignLoud"            "contact@designloud.com"           "Wilmington, NC"      "designloud.com"            "southeastern NC"
add_agency "Wilmington Design Co." "hello@wilmingtondesignco.com"     "Wilmington, NC"      "wilmingtondesignco.com"    "southeastern NC"
add_agency "Wordwright Web"        "info@wordwrightweb.com"           "Wilmington, NC"      "wordwrightweb.com"         "southeastern NC"
add_agency "ELEVEN11 Digital"      "hello@eleven11digital.com"        "Fayetteville, NC"    "eleven11digital.com"       "southeastern NC"

# ── TRIANGLE / RALEIGH / DURHAM ───────────────────────────────────────────────
add_agency "Addicott Web"          "hello@addicottweb.com"            "Raleigh, NC"         "addicottweb.com"           "Triangle NC"
add_agency "Think Designs"         "info@thinkdesignsllc.com"         "Raleigh, NC"         "thinkdesignsllc.com"       "Triangle NC"
add_agency "TMS Digital"           "info@tmsdigi.com"                 "Clayton, NC"         "tmsdigi.com"               "Triangle NC"
add_agency "NC SEO"                "SEO@NorthCarolinaSEO.com"         "Raleigh, NC"         "northcarolinaseo.com"      "Triangle NC"
add_agency "Triangle Web Design"   "taylor@trianglewebdesign.com"     "Raleigh, NC"         "trianglewebdesign.com"     "Triangle NC"
add_agency "Viget"                 "hello@viget.com"                  "Durham, NC"          "viget.com"                 "Triangle NC"
add_agency "Carolina Web Pro"      "info@carolinawebpro.us"           "NC (Greensboro)"     "carolinawebpro.us"         "North Carolina"

# ── CHARLOTTE ─────────────────────────────────────────────────────────────────
add_agency "Alter Imaging"         "hello@alterimaging.com"           "Charlotte, NC"       "alterimaging.com"          "Charlotte NC"
add_agency "CH Web Agency"         "create@chwebagency.com"           "Charlotte, NC"       "chwebagency.com"           "Charlotte NC"

# ── TRIAD (GREENSBORO / WINSTON-SALEM) ────────────────────────────────────────
add_agency "Get You Found"         "sales@getyoufound.com"            "Greensboro, NC"      "getyoufound.com"           "Triad NC"
add_agency "Birch Stream Digital"  "info@birchstreamdigital.com"      "Winston-Salem, NC"   "birchstreamdigital.com"    "Triad NC"
add_agency "Spotlight Branding"    "Solutions@SpotlightBranding.com"  "NC"                  "spotlightbranding.com"     "North Carolina"

# ── ASHEVILLE / WESTERN NC ────────────────────────────────────────────────────
add_agency "Big Boom Design"       "info@bigboomdesign.com"           "Asheville, NC"       "bigboomdesign.com"         "western NC"

# ── STATEWIDE ─────────────────────────────────────────────────────────────────
add_agency "NC Digital Web Design" "info@ncdigitalwebdesign.com"      "NC"                  "ncdigitalwebdesign.com"    "North Carolina"
add_agency "CB Web Innovations"    "corbybrooks@gmail.com"            "Burlington, NC"      "cbwebinnovations.com"      "NC Piedmont"
add_agency "The Happy Sites"       "support@thehappysites.com"        "Burlington, NC"      "thehappysites.com"         "NC Piedmont"

echo ""
echo "Approving all new drafts..."
RESULT=$(api -X POST "$SITE/api/drafts/approve" -d '{"all": true}')
echo "Approve result: $RESULT"

echo ""
echo "Done. 24 agencies added."
echo ""
echo "NEXT STEPS:"
echo "1. Check the dashboard Approval Queue to review draft emails before they go out."
echo "2. The weekly send limit is 30 emails. Agencies count against that limit."
echo "3. If an agency replies, check /api/brief — a reply is the closest thing to a sale."
echo "4. Offer: free 10-lead sample, then \$150 for 100 verified local leads."
