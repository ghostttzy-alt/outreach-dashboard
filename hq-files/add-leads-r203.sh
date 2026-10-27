#!/bin/bash
# Round 203: 6 Edenton, NC businesses.
# Found via visitedenton.com (dining, shopping, B&B pages), each email copied from the
# business's OWN website (homepage, /contact or /about). Never guessed.
# All 6 have a working website, so pitch the care plan (/care) or a small fix, not a new site.
# Usage: API_KEY=your_key bash hq-files/add-leads-r203.sh   (rerun-safe, API skips duplicates)

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"
if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  exit 1
fi

curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" -X POST "$SITE/api/leads" -d '{
  "leads": [
    {
      "businessName": "Edenton Coffee House",
      "niche": "Coffee shop",
      "city": "Edenton, NC",
      "email": "echcoffee@yahoo.com",
      "website": "https://www.edentoncoffeehouse.com",
      "websiteStatus": "OK",
      "source": "visitedenton.com (dining, shopping, B&B pages) + business'\''s own website",
      "sourceUrl": "https://www.edentoncoffeehouse.com",
      "createdBy": "overnight-session-r203",
      "runId": "2026-10-27-r203"
    },
    {
      "businessName": "Leon Nixon Catering",
      "niche": "Caterer",
      "city": "Edenton, NC",
      "email": "catering@leonnixoncatering.net",
      "website": "https://www.leonnixoncatering.com",
      "websiteStatus": "OK",
      "source": "visitedenton.com (dining, shopping, B&B pages) + business'\''s own website",
      "sourceUrl": "https://www.leonnixoncatering.com",
      "createdBy": "overnight-session-r203",
      "runId": "2026-10-27-r203"
    },
    {
      "businessName": "Rocky Hock Campground",
      "niche": "Campground",
      "city": "Edenton, NC",
      "email": "info@rockyhockcampground.com",
      "website": "https://www.rockyhockcampground.com",
      "websiteStatus": "OK",
      "source": "visitedenton.com (dining, shopping, B&B pages) + business'\''s own website",
      "sourceUrl": "https://www.rockyhockcampground.com",
      "createdBy": "overnight-session-r203",
      "runId": "2026-10-27-r203"
    },
    {
      "businessName": "North No. 4",
      "niche": "Gourmet food and gift shop",
      "city": "Edenton, NC",
      "email": "Hello@NorthNo4.com",
      "website": "https://northno4.com",
      "websiteStatus": "OK",
      "source": "visitedenton.com (dining, shopping, B&B pages) + business'\''s own website",
      "sourceUrl": "https://northno4.com",
      "createdBy": "overnight-session-r203",
      "runId": "2026-10-27-r203"
    },
    {
      "businessName": "Inner Banks Inn",
      "niche": "Bed and breakfast",
      "city": "Edenton, NC",
      "email": "hello@innerbanksinn.com",
      "website": "https://www.innerbanksinn.com",
      "websiteStatus": "OK",
      "source": "visitedenton.com (dining, shopping, B&B pages) + business'\''s own website",
      "sourceUrl": "https://www.innerbanksinn.com",
      "createdBy": "overnight-session-r203",
      "runId": "2026-10-27-r203"
    },
    {
      "businessName": "The Herringbone",
      "niche": "Restaurant",
      "city": "Edenton, NC",
      "email": "hello@theherringboneedenton.com",
      "website": "https://the-herringbone.com",
      "websiteStatus": "OK",
      "source": "visitedenton.com (dining, shopping, B&B pages) + business'\''s own website",
      "sourceUrl": "https://the-herringbone.com",
      "createdBy": "overnight-session-r203",
      "runId": "2026-10-27-r203"
    }
  ]
}'
echo
