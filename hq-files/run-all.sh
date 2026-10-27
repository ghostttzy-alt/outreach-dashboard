#!/bin/bash
# One command to load everything the overnight rounds staged.
# Usage: API_KEY=your_key bash hq-files/run-all.sh
#
# Safe to run more than once: the leads API skips duplicates (same email,
# name+city or website), and the agency scripts skip drafts for skipped leads.
# Emails still go out only through the dashboard's normal ramp and sending hours.

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"
DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running."
  echo "  API_KEY=your_key bash hq-files/run-all.sh"
  echo "  (Netlify -> Site configuration -> Environment variables -> API_KEY)"
  exit 1
fi

# Check the key works before running anything.
CODE=$(curl -sS -o /dev/null -w "%{http_code}" -H "x-api-key: $KEY" "$SITE/api/brief")
if [ "$CODE" != "200" ]; then
  echo "ERROR: $SITE/api/brief answered $CODE. Check the API_KEY and that the site is up."
  exit 1
fi

for s in add-leads.sh add-leads-n2.sh add-leads-r200.sh add-leads-r201.sh add-leads-r202.sh add-agencies.sh add-agencies-r197.sh add-hq-logs-n2.sh; do
  echo ""
  echo "===== $s ====="
  API_KEY="$KEY" SITE="$SITE" bash "$DIR/$s"
done

echo ""
echo "===== Brief ====="
curl -sS -H "x-api-key: $KEY" "$SITE/api/brief" | jq . 2>/dev/null || true
echo ""
echo "Done. Open $SITE and check the Approval queue."
