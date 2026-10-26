// Default email templates, shared by the seed and the clear script.
export const DEFAULT_TEMPLATES = [
  {
    key: "first",
    name: "First touch",
    subject: "Quick idea for {business_name}'s website",
    body: `Hi {first_name},

I was looking for {niche} businesses in {city} and came across {business_name}. I noticed {problem}, which is likely costing you calls from people searching on their phones.

I design simple, fast websites for local businesses. If you're open to it, I'd be happy to put together a free homepage mockup so you can see what it could look like. No cost and no obligation.

Want me to send one over?

{my_name}
{my_business}
{mailing_address}

If you'd rather not hear from me again, just reply "no thanks" and I won't follow up.`,
  },
  {
    key: "followup1",
    name: "Follow-up 1",
    subject: "Re: Quick idea for {business_name}'s website",
    body: `Hi {first_name},

Just floating this back to the top of your inbox. I'd still be glad to mock up a new homepage for {business_name}, free.

Should I go ahead?

{my_name}
{my_business}
{mailing_address}

Reply "no thanks" and I won't email again.`,
  },
  {
    key: "followup2",
    name: "Follow-up 2",
    subject: "Last note about {business_name}",
    body: `Hi {first_name},

I don't want to crowd your inbox, so this is my last note. If a better website for {business_name} ever becomes a priority, just reply here and I'll send over a free mockup.

All the best,
{my_name}
{my_business}
{mailing_address}`,
  },
  {
    key: "mockup",
    name: "Mockup reply",
    subject: "Your free homepage mockup for {business_name}",
    body: `Hi {first_name},

Thanks for getting back to me! Here's the homepage mockup I put together for {business_name}:

{mockup_url}

It's built to load fast, look great on phones, and make it easy for customers to call or book. If you like the direction, I can have the full site live within a week.

Let me know what you think.

{my_name}
{my_business}
{mailing_address}`,
  },
];
