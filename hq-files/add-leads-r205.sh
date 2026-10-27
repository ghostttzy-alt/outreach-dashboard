#!/bin/bash
# Round 205: 11 Pamlico County area businesses.
# Found via pamlicochamber.com/members, each email copied from the
# business's OWN website (homepage, /contact or /about). Never guessed.
# All 11 have a working website, so pitch the care plan (/care) or a small fix, not a new site.
# Usage: API_KEY=your_key bash hq-files/add-leads-r205.sh   (rerun-safe, API skips duplicates)

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"
if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  exit 1
fi

curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" -X POST "$SITE/api/leads" -d '{
  "leads": [
    {
      "businessName": "Bayboro Pharmacy",
      "niche": "Pharmacy",
      "city": "Bayboro, NC",
      "email": "bayboropharmacy@gmail.com",
      "website": "https://www.bayboropharmacy.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "https://www.bayboropharmacy.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "Ensign Harbor Marina",
      "niche": "Marina",
      "city": "Merritt, NC",
      "email": "ensignharbormarina@gmail.com",
      "website": "http://www.ensignharbormarina.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "http://www.ensignharbormarina.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "From the Heart Florist",
      "niche": "Florist",
      "city": "Bayboro, NC",
      "email": "fromtheheartflorist99@gmail.com",
      "website": "http://fromtheheartfloristnc.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "http://fromtheheartfloristnc.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "Hollowell & Hollowell",
      "niche": "Law firm",
      "city": "Bayboro, NC",
      "email": "info@pamlicolawyers.com",
      "website": "https://www.pamlicolawyers.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "https://www.pamlicolawyers.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "Marc Jessup Insurance",
      "niche": "Insurance agency",
      "city": "New Bern, NC",
      "email": "info@flatlandsjessup.com",
      "website": "https://flatlandsjessup.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "https://flatlandsjessup.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "Mariner Realty",
      "niche": "Real estate",
      "city": "Oriental, NC",
      "email": "info@orientalncwaterfront.com",
      "website": "https://www.orientalncwaterfront.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "https://www.orientalncwaterfront.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "New Village Brewery & Taproom",
      "niche": "Brewery",
      "city": "Oriental, NC",
      "email": "thenewvillagebrewery@gmail.com",
      "website": "http://www.newvillagebrewery.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "http://www.newvillagebrewery.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "The X-Team Termite & Pest Control",
      "niche": "Pest control",
      "city": "New Bern, NC",
      "email": "info@xteampest.com",
      "website": "https://www.xteamtermiteandpest.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "https://www.xteamtermiteandpest.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "Tidewater Appliance",
      "niche": "Appliance store",
      "city": "New Bern, NC",
      "email": "tidewaterappliance@gmail.com",
      "website": "https://www.tidewaterappliance.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "https://www.tidewaterappliance.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "Tidewater Real Estate",
      "niche": "Real estate",
      "city": "Oriental, NC",
      "email": "info@tidewatercountry.com",
      "website": "http://tidewatercountry.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "http://tidewatercountry.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    },
    {
      "businessName": "Wayfarers Cove Marina",
      "niche": "Marina",
      "city": "Minnesott Beach, NC",
      "email": "info@wayfarerscove.com",
      "website": "http://www.wayfarerscovemarina.com",
      "websiteStatus": "OK",
      "source": "pamlicochamber.com member list + business'\''s own website",
      "sourceUrl": "http://www.wayfarerscovemarina.com",
      "createdBy": "overnight-session-r205",
      "runId": "2026-10-27-r205"
    }
  ]
}'
echo
