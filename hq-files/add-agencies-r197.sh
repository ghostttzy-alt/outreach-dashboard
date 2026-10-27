#!/bin/bash
# Add 2 more Southeast (round 197) web design & marketing agencies as leads with draft pitch emails.
# Each email offers a free 10-lead sample from their area, then $150/100 verified leads.
#
# Usage: API_KEY=your_key SITE=https://ghostzy.netlify.app bash hq-files/add-agencies-r197.sh
#
# SITE defaults to https://ghostzy.netlify.app
# Run AFTER the deploy succeeds and you have your API_KEY from Netlify env vars.

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"

if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running."
  echo "  API_KEY=your_key bash hq-files/add-agencies-r197.sh"
  exit 1
fi

api() {
  curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" "$@"
}

# Add one agency and queue a draft pitch email.
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
    \"runId\": \"2026-10-27-r197-agencies\"
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

# Emails below were shown on each agency's own website (checked 2026-10-27).
add_agency "EZ Marketing"          "info@ezmarketing.com"             "Southeast US"        "ezmarketing.com"           "eastern NC"
add_agency "Emulent"               "bill@emulent.com"                 "Southeast US"        "emulent.com"               "the Carolinas"

echo ""
echo "Approving all new drafts..."
api -X POST "$SITE/api/drafts/approve" -d '{"all": true}'
echo ""
echo "Done. Run add-agencies.sh first if you haven't (24 agencies). Together: 26."
