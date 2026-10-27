#!/bin/bash
# Add Night 2 leads via the API.
# Usage: API_KEY=your_key SITE=https://ghostzy.netlify.app bash hq-files/add-leads-n2.sh
#
# Run this AFTER confirming Night 2 deploy succeeded.

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"

if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  echo "Example: API_KEY=your_key bash hq-files/add-leads-n2.sh"
  exit 1
fi

api() {
  curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" "$@"
}

echo "Adding Night 2 leads to $SITE..."

# ============================================================
# LOCAL BUSINESSES — Greenville NC (from ECU approved catering list)
# All emails are confirmed as shown on ecu.edu public page
# ============================================================

echo "--- LOCAL BUSINESSES ---"

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Carryout by Chrislyn",
  "niche": "Caterer",
  "city": "Greenville, NC",
  "phone": "(252) 623-2014",
  "email": "tracey@carryoutbychrislyn.com",
  "website": "",
  "websiteStatus": "None",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "China 10",
  "niche": "Restaurant",
  "city": "Greenville, NC",
  "phone": "(252) 830-2238",
  "email": "ChinaNC@gmail.com",
  "website": "https://mychina10.com",
  "websiteStatus": "Has Website",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Cinnamon Bistro Indian Cuisine",
  "niche": "Restaurant",
  "city": "Greenville, NC",
  "phone": "(252) 565-8935",
  "email": "bistrocinnamon@gmail.com",
  "website": "",
  "websiteStatus": "None",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Dank Burrito",
  "niche": "Restaurant",
  "city": "Greenville, NC",
  "phone": "(252) 751-0439",
  "email": "greenville@dankburrito.com",
  "website": "https://dankburrito.com",
  "websiteStatus": "Has Website",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Different Bites Catering",
  "niche": "Caterer",
  "city": "Greenville, NC",
  "phone": "(978) 390-2267",
  "email": "differentbitescatering@gmail.com",
  "website": "",
  "websiteStatus": "None",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Farmer and the Dail",
  "niche": "Restaurant",
  "city": "Wilson, NC",
  "phone": "(252) 747-1392",
  "email": "zac@farmerandthedail.com",
  "website": "https://farmerandthedail.com",
  "websiteStatus": "Has Website",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "G & K Cafe and Catering",
  "niche": "Cafe & Caterer",
  "city": "Greenville, NC",
  "phone": "(252) 752-7662",
  "email": "service@gkcafeandcatering.com",
  "website": "https://gkcafegreenville.com",
  "websiteStatus": "Has Website",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Moosie'\''s Catering Co.",
  "niche": "Caterer",
  "city": "Greenville, NC",
  "phone": "(252) 565-2939",
  "email": "moosiecatco@gmail.com",
  "website": "",
  "websiteStatus": "Facebook Only",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Open House Baking",
  "niche": "Bakery",
  "city": "Greenville, NC",
  "phone": "(252) 320-9147",
  "email": "openhousebaking@gmail.com",
  "website": "https://openhousebaking.com",
  "websiteStatus": "Has Website",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Rock Spring Center",
  "niche": "Event Venue",
  "city": "Greenville, NC",
  "phone": "(252) 830-8900",
  "email": "event@rockspringscenter.com",
  "website": "https://rockspringscenter.com",
  "websiteStatus": "Has Website",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Something Different Cafe",
  "niche": "Restaurant",
  "city": "Wilson, NC",
  "phone": "(252) 291-0889",
  "email": "somethingdifferentcafe@gmail.com",
  "website": "",
  "websiteStatus": "None",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Williams Catering & Grill",
  "niche": "Caterer",
  "city": "Greenville, NC",
  "phone": "(252) 717-7322",
  "email": "williamscatering16@gmail.com",
  "website": "",
  "websiteStatus": "None",
  "source": "ECU Approved Catering List",
  "sourceUrl": "https://cro.ecu.edu/?p=2165",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

# ============================================================
# MARKETING AGENCIES — NC/SE (for lead list sales)
# All emails confirmed on their own websites
# ============================================================

echo "--- MARKETING AGENCIES ---"

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Blue Tone Media",
  "niche": "Marketing agency",
  "city": "Wilmington, NC",
  "phone": "(910) 795-2280",
  "email": "info@bluetonemedia.com",
  "website": "https://bluetonemedia.com",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Red Shark Digital",
  "niche": "Marketing agency",
  "city": "Greenville, NC",
  "phone": "(252) 751-9200",
  "email": "info@redsharkdigital.com",
  "website": "https://redsharkdigital.com",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "WiT Group",
  "niche": "Marketing agency",
  "city": "Charlotte, NC",
  "phone": "(704) 336-9018",
  "email": "connect@witgroup.info",
  "website": "https://witgroupagency.com",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Eleven11 Digital",
  "niche": "Marketing agency",
  "city": "Fayetteville, NC",
  "phone": "(910) 748-5414",
  "email": "hello@eleven11.digital",
  "website": "https://eleven11.digital",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "NiceDay",
  "niche": "Marketing agency",
  "city": "Charlotte, NC",
  "email": "hello@nicedayahead.com",
  "website": "https://nicedayahead.com",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Signature W Studio",
  "niche": "Marketing agency",
  "city": "Charlotte, NC",
  "phone": "(704) 648-2995",
  "email": "connect@signaturewstudio.com",
  "website": "https://signaturewstudio.com",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "Spotlight Branding",
  "niche": "Marketing agency",
  "city": "Huntersville, NC",
  "phone": "(800) 406-7229",
  "email": "Solutions@SpotlightBranding.com",
  "website": "https://spotlightbranding.com",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

api -X POST "$SITE/api/leads" -d '{
  "businessName": "New Media Campaigns",
  "niche": "Marketing agency",
  "city": "Carrboro, NC",
  "phone": "(919) 338-7830",
  "email": "sales@newmediacampaigns.com",
  "website": "https://newmediacampaigns.com",
  "websiteStatus": "Has Website",
  "source": "Agency research Night 2",
  "createdBy": "overnight-session-n2",
  "runId": "2026-10-27-night2"
}'
echo ""

echo "Done. Check the dashboard for results."
echo "Total: 20 leads (12 local businesses + 8 agencies)"
