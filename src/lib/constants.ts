export const STAGES = [
  "Queued",
  "Contacted",
  "Follow-up 1",
  "Follow-up 2",
  "Replied",
  "Interested",
  "Mockup Sent",
  "Won",
  "Lost",
  "Cold",
  "Do Not Contact",
] as const;
export type Stage = (typeof STAGES)[number];

export const FUNNEL_STAGES = ["Queued", "Contacted", "Replied", "Interested", "Mockup Sent", "Won"] as const;

export const WEBSITE_STATUSES = ["None", "Broken", "Not Mobile", "Outdated", "No HTTPS", "OK"] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const EMAIL_DIRECTIONS = ["outbound", "inbound"] as const;
export const EMAIL_TYPES = ["first", "followup1", "followup2", "reply", "mockup"] as const;
export const EMAIL_STATUSES = ["draft", "sent", "opened", "replied", "bounced", "unsubscribed"] as const;

export const EMAIL_TYPE_LABELS: Record<string, string> = {
  first: "First touch",
  followup1: "Follow-up 1",
  followup2: "Follow-up 2",
  reply: "Reply",
  mockup: "Mockup",
};

export const SITE_TYPES = ["mockup", "client"] as const;
export const SITE_STATUSES = ["Mockup", "In Progress", "Live"] as const;
export const CLIENT_STATUSES = ["active", "paused", "cancelled"] as const;

/** Stages where the lead is out of the active pipeline. */
export const CLOSED_STAGES: string[] = ["Won", "Lost", "Cold", "Do Not Contact"];

/** Funnel order, used so automatic stage changes only ever move a lead forward. */
export const STAGE_RANK: Record<string, number> = {
  Queued: 0,
  Contacted: 1,
  "Follow-up 1": 2,
  "Follow-up 2": 3,
  Replied: 4,
  Interested: 5,
  "Mockup Sent": 6,
  Won: 7,
};

/** Deliverability ramp: emails per day by week since the ramp start date. */
export const RAMP = [20, 30, 40, 50];

export const TEMPLATE_VARIABLES = [
  "{business_name}",
  "{first_name}",
  "{problem}",
  "{city}",
  "{niche}",
  "{website}",
  "{mockup_url}",
  "{my_name}",
  "{my_business}",
  "{mailing_address}",
];
