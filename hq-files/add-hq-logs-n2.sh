#!/bin/bash
# Add Night 2 HQ log entries via the API.
# Usage: API_KEY=your_key SITE=https://ghostzy.netlify.app bash hq-files/add-hq-logs-n2.sh

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"

if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  exit 1
fi

api() {
  curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" "$@"
}

echo "Logging Night 2 activity to HQ..."

api -X POST "$SITE/api/hq/logs" -d '{
  "project": "YouTube — College Hacks",
  "note": "Night 2: Made 6 new Shorts (eat $25/week, free software, freshman mistakes, $5 meals, split costs, free campus food). All in hq-files/youtube/ready/ ready to upload. Different visual styles and topics from Night 1."
}'
echo ""

api -X POST "$SITE/api/hq/logs" -d '{
  "project": "Lead Lists",
  "note": "Night 2: Found 12 Greenville NC businesses with confirmed emails from ECU approved catering list. Found 8 NC marketing agencies with confirmed emails. Script: hq-files/add-leads-n2.sh."
}'
echo ""

api -X POST "$SITE/api/hq/logs" -d '{
  "project": "Web Design",
  "note": "Night 2: Built /free resources page at ghostzy.netlify.app/free — shows 3 digital products and links to /care. Clean dark design matching the site."
}'
echo ""

api -X POST "$SITE/api/hq/logs" -d '{
  "project": "Etsy Digital Products",
  "note": "Night 2: /free page built to promote the 3 products. Still waiting on user to open Etsy/Gumroad account to list them."
}'
echo ""

echo "Done."
