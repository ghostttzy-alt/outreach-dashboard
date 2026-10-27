#!/bin/bash
# Round 201: 12 downtown New Bern businesses.
# Found via downtownnewbern.com (eat-drink, shop) and visitnewbern.com (eat-drink, where-to-shop),
# each email copied from the business's OWN website (homepage, /contact or /about). Never guessed.
# All 12 have a working website, so pitch the care plan (/care) or a small fix, not a new site.
# Usage: API_KEY=your_key bash hq-files/add-leads-r201.sh   (rerun-safe, API skips duplicates)

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"
if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  exit 1
fi

curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" -X POST "$SITE/api/leads" -d '{
  "leads": [
    {
      "businessName": "Baker'\''s Kitchen",
      "niche": "Restaurant",
      "city": "New Bern, NC",
      "email": "info@bakerskitchennb.com",
      "website": "http://bakerskitchennb.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "http://bakerskitchennb.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "MJ'\''s Raw Bar & Grille",
      "niche": "Restaurant",
      "city": "New Bern, NC",
      "email": "info@mjsrawbar.com",
      "website": "http://www.mjsrawbar.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "http://www.mjsrawbar.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Brewery 99",
      "niche": "Brewery",
      "city": "New Bern, NC",
      "email": "pete@brewery99.com",
      "website": "http://www.brewery99.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "http://www.brewery99.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Front Street Fish Co.",
      "niche": "Restaurant",
      "city": "New Bern, NC",
      "email": "hello@frontstreetfish.com",
      "website": "http://www.frontstreetfish.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "http://www.frontstreetfish.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Blackbeard'\''s Triple Play",
      "niche": "Family entertainment",
      "city": "New Bern, NC",
      "email": "blackbeards3play@yahoo.com",
      "website": "https://blackbeardstripleplay.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "https://blackbeardstripleplay.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Surf, Wind and Fire",
      "niche": "Retail store",
      "city": "New Bern, NC",
      "email": "loveourcustomers@surfwindandfire.com",
      "website": "http://www.surfwindandfire.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "http://www.surfwindandfire.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Cork Wine Bar & Bistro",
      "niche": "Restaurant",
      "city": "New Bern, NC",
      "email": "corkwinebarbistro@gmail.com",
      "website": "https://corkwinebarandbistro.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "https://corkwinebarandbistro.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Bella'\''s Cafe & Catering",
      "niche": "Cafe",
      "city": "New Bern, NC",
      "email": "bellascafenb@gmail.com",
      "website": "https://www.bellascafenb.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "https://www.bellascafenb.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "The Flying Fox",
      "niche": "Bar",
      "city": "New Bern, NC",
      "email": "cheers@flyingfoxnb.com",
      "website": "https://www.flyingfoxnb.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "https://www.flyingfoxnb.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Poppy'\''s Bites and Barrels",
      "niche": "Restaurant",
      "city": "New Bern, NC",
      "email": "info@bitesandbarrels.com",
      "website": "https://www.bitesandbarrels.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "https://www.bitesandbarrels.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "Lawsons On The Creek",
      "niche": "Restaurant",
      "city": "New Bern, NC",
      "email": "eatatlawsons@gmail.com",
      "website": "https://www.lawsonsonthecreek.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "https://www.lawsonsonthecreek.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    },
    {
      "businessName": "The Chelsea Restaurant & Catering",
      "niche": "Restaurant",
      "city": "New Bern, NC",
      "email": "greatfood@thechelsea.com",
      "website": "https://www.thechelsea.com",
      "websiteStatus": "OK",
      "source": "Downtown New Bern (Swiss Bear) + Visit New Bern directories + business'\''s own website",
      "sourceUrl": "https://www.thechelsea.com",
      "createdBy": "overnight-session-r201",
      "runId": "2026-10-27-r201"
    }
  ]
}'
echo ""
echo "Done: 12 New Bern leads sent to $SITE (duplicates skipped)."
