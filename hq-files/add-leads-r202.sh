#!/bin/bash
# Round 202: 16 downtown Morehead City / Beaufort businesses.
# Found via downtownmoreheadcity.com (directory, dine, shop), each email copied from the
# business's OWN website (homepage, /contact or /about). Never guessed.
# All 16 have a working website, so pitch the care plan (/care) or a small fix, not a new site.
# Usage: API_KEY=your_key bash hq-files/add-leads-r202.sh   (rerun-safe, API skips duplicates)

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"
if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  exit 1
fi

curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" -X POST "$SITE/api/leads" -d '{
  "leads": [
    {
      "businessName": "Beaufort Olive Oil Co.",
      "niche": "Specialty food shop",
      "city": "Beaufort, NC",
      "email": "oil@beaufortoliveoil.com",
      "website": "https://www.beaufortoliveoil.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://www.beaufortoliveoil.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Blu Sail (Golitz Studios)",
      "niche": "Art gallery",
      "city": "Morehead City, NC",
      "email": "blu@blu-sail.com",
      "website": "https://www.blu-sail.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://www.blu-sail.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Catch109",
      "niche": "Restaurant",
      "city": "Morehead City, NC",
      "email": "catch109nc@gmail.com",
      "website": "https://catch109.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://catch109.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Full Circle Cafe",
      "niche": "Cafe",
      "city": "Morehead City, NC",
      "email": "epicureaneatsinc@gmail.com",
      "website": "https://fullcirclecafe.biz",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://fullcirclecafe.biz",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Inkspiration Studio",
      "niche": "Art studio",
      "city": "Morehead City, NC",
      "email": "inkspirationart@gmail.com",
      "website": "https://www.inkspirationstudio.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://www.inkspirationstudio.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Jack'\''s on the Waterfront",
      "niche": "Restaurant",
      "city": "Morehead City, NC",
      "email": "jackswaterfrontbar@gmail.com",
      "website": "https://www.jacksonthewaterfront.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://www.jacksonthewaterfront.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Ocean Outfitterz & Co",
      "niche": "Retail shop",
      "city": "Morehead City, NC",
      "email": "oceanoutfitterz@gmail.com",
      "website": "http://www.oceanoutfitterz.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "http://www.oceanoutfitterz.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Red Fish Grill",
      "niche": "Restaurant",
      "city": "Morehead City, NC",
      "email": "redfishgrillnc@gmail.com",
      "website": "https://redfishgrillandbar.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://redfishgrillandbar.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Sanitary Fish Market & Restaurant",
      "niche": "Restaurant",
      "city": "Morehead City, NC",
      "email": "info@sanitaryfishmarket.com",
      "website": "https://www.sanitaryfishmarket.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://www.sanitaryfishmarket.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Z & Z Designs",
      "niche": "Retail shop",
      "city": "Morehead City, NC",
      "email": "sales@zandzdesigns.com",
      "website": "https://zandzdesigns.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://zandzdesigns.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Arendell Room Bar",
      "niche": "Bar",
      "city": "Morehead City, NC",
      "email": "barchef101@icloud.com",
      "website": "https://arendellbar.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://arendellbar.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Active Life Bodywork",
      "niche": "Massage therapy",
      "city": "Morehead City, NC",
      "email": "activelifebodywork@gmail.com",
      "website": "https://www.activelifebodywork.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://www.activelifebodywork.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Hope Mission Thrift Store",
      "niche": "Thrift store",
      "city": "Morehead City, NC",
      "email": "info@hopemissionthriftstore.org",
      "website": "https://hopemissionthriftstore.org",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://hopemissionthriftstore.org",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Kidz at Play Family Cafe",
      "niche": "Family cafe",
      "city": "Morehead City, NC",
      "email": "kidzatplayco@gmail.com",
      "website": "https://kidzatplayfamilycafe.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://kidzatplayfamilycafe.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Shop Dorsea",
      "niche": "Boutique",
      "city": "Morehead City, NC",
      "email": "kendall@shopdorsea.com",
      "website": "https://shopdorsea.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://shopdorsea.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    },
    {
      "businessName": "Atlantic Coast Marine Group",
      "niche": "Marine services",
      "city": "Morehead City, NC",
      "email": "management@atlanticcoastmarinegroup.com",
      "website": "https://www.atlanticcoastmarinegroup.com",
      "websiteStatus": "OK",
      "source": "Downtown Morehead City directory (downtownmoreheadcity.com /directory /dine /shop) + business'\''s own website",
      "sourceUrl": "https://www.atlanticcoastmarinegroup.com",
      "createdBy": "overnight-session-r202",
      "runId": "2026-10-27-r202"
    }
  ]
}'
echo ""
echo "Done: 16 Morehead City/Beaufort leads sent to $SITE (duplicates skipped)."
