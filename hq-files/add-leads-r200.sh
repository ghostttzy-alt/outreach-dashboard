#!/bin/bash
# Round 200: 20 Uptown/downtown Greenville businesses.
# Found via the Downtown Greenville Partnership directory (downtowngreenville.com
# eat/shop/services/nightlife), each email copied from the business's OWN website
# (homepage, /contact or /about). Never guessed. All 20 have a working website, so the
# better pitch is the care plan (/care) or a small fix, not a new site.
# Usage: API_KEY=your_key bash hq-files/add-leads-r200.sh   (rerun-safe, API skips duplicates)

SITE="${SITE:-https://ghostzy.netlify.app}"
KEY="${API_KEY}"
if [ -z "$KEY" ]; then
  echo "ERROR: set API_KEY before running this script."
  exit 1
fi

curl -sS -H "x-api-key: $KEY" -H "Content-Type: application/json" -X POST "$SITE/api/leads" -d '{
  "leads": [
    {
      "businessName": "CrossFit Greenville",
      "niche": "Gym",
      "city": "Greenville, NC",
      "email": "matt@crossfitgreenville.com",
      "website": "https://crossfitgreenville.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://crossfitgreenville.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "CRYO252",
      "niche": "Wellness studio",
      "city": "Greenville, NC",
      "email": "mike@cryo252.com",
      "website": "https://cryo252.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://cryo252.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Cape Fear Tattoo & Piercing",
      "niche": "Tattoo shop",
      "city": "Greenville, NC",
      "email": "capefeartattoomanagement@gmail.com",
      "website": "https://capefeartattoonc.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://capefeartattoonc.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Luna Pizza Cafe",
      "niche": "Restaurant",
      "city": "Greenville, NC",
      "email": "lunapizzacafe@gmail.com",
      "website": "https://lunapizzacafe.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://lunapizzacafe.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Garry'\''s Skin Grafix Tattoo & Piercing",
      "niche": "Tattoo shop",
      "city": "Greenville, NC",
      "email": "preston@skingrafix.com",
      "website": "http://skingrafix.com",
      "websiteStatus": "No HTTPS",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "http://skingrafix.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Truly Yours Boutique",
      "niche": "Clothing boutique",
      "city": "Greenville, NC",
      "email": "Erin@shoptrulyyours.com",
      "website": "https://shoptrulyyours.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://shoptrulyyours.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Aji",
      "niche": "Restaurant",
      "city": "Greenville, NC",
      "email": "patrickandasheera@yahoo.com",
      "website": "https://sweetaji.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://sweetaji.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Angus Grill",
      "niche": "Restaurant",
      "city": "Greenville, NC",
      "email": "angusgrillnc@gmail.com",
      "website": "https://www.angusgrillnc.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.angusgrillnc.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "5th Street Hardware",
      "niche": "Bar",
      "city": "Greenville, NC",
      "email": "info@5thStreetHardware.com",
      "website": "https://5thstreethardware.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://5thstreethardware.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Christy'\''s Euro Pub",
      "niche": "Bar",
      "city": "Greenville, NC",
      "email": "christyseurop@gmail.com",
      "website": "https://www.christyseuropub.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.christyseuropub.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Anger Management Rage Room",
      "niche": "Entertainment",
      "city": "Greenville, NC",
      "email": "angermgmtrageroom@gmail.com",
      "website": "https://www.angermgmtnc.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.angermgmtnc.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Native Fine Diner",
      "niche": "Restaurant",
      "city": "Greenville, NC",
      "email": "events@nativetonguehospitality.com",
      "website": "https://www.eatatnative.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.eatatnative.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Blackbeard Coffee Roasters",
      "niche": "Coffee shop",
      "city": "Greenville, NC",
      "email": "info@blackbeardroasters.com",
      "website": "https://blackbeardroasters.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://blackbeardroasters.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Greenville Museum of Art",
      "niche": "Nonprofit",
      "city": "Greenville, NC",
      "email": "info@gmoa.org",
      "website": "https://www.gmoa.org",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.gmoa.org",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Sidebar",
      "niche": "Bar",
      "city": "Greenville, NC",
      "email": "info@sidebargreenvillenc.com",
      "website": "https://www.sidebargreenville.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.sidebargreenville.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Starlight Cafe and Farm",
      "niche": "Restaurant",
      "city": "Greenville, NC",
      "email": "starlightcafebooking@gmail.com",
      "website": "https://www.starlightcafeandfarm.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.starlightcafeandfarm.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Southern Soleil",
      "niche": "Local business",
      "city": "Greenville, NC",
      "email": "southernsoleil252@gmail.com",
      "website": "https://www.southern-soleil.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.southern-soleil.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "The Holistic Co.",
      "niche": "Wellness studio",
      "city": "Greenville, NC",
      "email": "info@theholisticco.com",
      "website": "https://www.theholisticco.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.theholisticco.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "Homage Restaurant",
      "niche": "Restaurant",
      "city": "Greenville, NC",
      "email": "Chefmattkingcole@gmail.com",
      "website": "https://www.thehomagerestaurant.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.thehomagerestaurant.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    },
    {
      "businessName": "The Sojo",
      "niche": "Local business",
      "city": "Greenville, NC",
      "email": "hello@thesojo.com",
      "website": "https://www.thesojo.com",
      "websiteStatus": "OK",
      "source": "Downtown Greenville Partnership directory + business'\''s own website",
      "sourceUrl": "https://www.thesojo.com",
      "createdBy": "overnight-session-r200",
      "runId": "2026-10-27-r200"
    }
  ]
}'
echo ""
echo "Done: 20 Greenville leads sent to $SITE (duplicates skipped)."
