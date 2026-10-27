#!/bin/bash
# Round 204: 17 Oriental, NC businesses.
# Found via townoforiental.com/business-directory, each email copied from the
# business's OWN website (homepage, /contact or /about). Never guessed.
# All 17 have a working website, so pitch the care plan (/care) or a small fix, not a new site.
# Usage: API_KEY=your_key bash hq-files/add-leads-r204.sh   (rerun-safe, API skips duplicates)

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"
if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  exit 1
fi

curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" -X POST "$SITE/api/leads" -d '{
  "leads": [
    {
      "businessName": "The Silos Restaurant",
      "niche": "Restaurant",
      "city": "Oriental, NC",
      "email": "info@silosnc.com",
      "website": "https://www.silosnc.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.silosnc.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Whittaker Pointe Marina",
      "niche": "Marina",
      "city": "Oriental, NC",
      "email": "dockmaster@whittakerpointe.com",
      "website": "https://www.whittakerpointe.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.whittakerpointe.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Sailcraft Service",
      "niche": "Boat yard",
      "city": "Oriental, NC",
      "email": "info@sailcraftservice.com",
      "website": "https://www.sailcraftservice.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.sailcraftservice.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Shane Harris Construction",
      "niche": "Contractor",
      "city": "Oriental, NC",
      "email": "info@shaneharrisconstruction.com",
      "website": "https://www.shaneharrisconstruction.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.shaneharrisconstruction.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Magnolia House",
      "niche": "Bed and breakfast",
      "city": "Oriental, NC",
      "email": "magnoliahouse.oriental@gmail.com",
      "website": "https://www.magnoliahouse-nc.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.magnoliahouse-nc.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Bow To Stern Boating",
      "niche": "Boat services",
      "city": "Oriental, NC",
      "email": "info@bowtosternboating.com",
      "website": "https://www.bowtosternboating.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.bowtosternboating.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Paradise Shores Adventures",
      "niche": "Fishing charter",
      "city": "Oriental, NC",
      "email": "paradiseshoresadventures@gmail.com",
      "website": "https://www.paradiseshoresadventures.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.paradiseshoresadventures.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Oriental Marina & Inn",
      "niche": "Hotel",
      "city": "Oriental, NC",
      "email": "orientalmarinainn@yahoo.com",
      "website": "https://www.orientalmarina.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.orientalmarina.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Sail Loft Realty",
      "niche": "Real estate",
      "city": "Oriental, NC",
      "email": "admin@sailloftrealty.com",
      "website": "https://www.sailloftrealty.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.sailloftrealty.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "River Neuse Suites",
      "niche": "Hotel",
      "city": "Oriental, NC",
      "email": "frontdesk@riverneuserentals.com",
      "website": "https://www.riverneuserentals.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.riverneuserentals.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Southern Sky Lodge",
      "niche": "Lodging",
      "city": "Oriental, NC",
      "email": "info@southernskylodge.com",
      "website": "https://southernskylodge.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://southernskylodge.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "The Bean",
      "niche": "Coffee shop",
      "city": "Oriental, NC",
      "email": "info@beanonc.com",
      "website": "https://www.beanonc.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.beanonc.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Harbor View Day Spa",
      "niche": "Day spa",
      "city": "Oriental, NC",
      "email": "harborviewdayspa@gmail.com",
      "website": "https://www.harborviewdayspa.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.harborviewdayspa.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Clancy'\''s Marina",
      "niche": "Marina",
      "city": "Oriental, NC",
      "email": "mrgears65@gmail.com",
      "website": "https://www.clancysmarina.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.clancysmarina.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "The Gentleman'\''s Chair",
      "niche": "Barber",
      "city": "Oriental, NC",
      "email": "barbersbythebayoriental@gmail.com",
      "website": "https://www.thegentlemanschairenc.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.thegentlemanschairenc.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Triton Yachts",
      "niche": "Yacht broker",
      "city": "Oriental, NC",
      "email": "sales@tritonyachts.com",
      "website": "https://www.tritonyachts.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.tritonyachts.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    },
    {
      "businessName": "Inn at Oriental",
      "niche": "Bed and breakfast",
      "city": "Oriental, NC",
      "email": "innatoriental@gmail.com",
      "website": "https://www.innatoriental.com",
      "websiteStatus": "OK",
      "source": "townoforiental.com business directory + business'\''s own website",
      "sourceUrl": "https://www.innatoriental.com",
      "createdBy": "overnight-session-r204",
      "runId": "2026-10-27-r204"
    }
  ]
}'
echo
