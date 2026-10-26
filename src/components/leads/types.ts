export type LeadRow = {
  id: string;
  businessName: string;
  niche: string;
  city: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  websiteStatus: string;
  mainProblem: string;
  score: number;
  stage: string;
  dateContacted: string | null;
  mockupUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
};

export type Filters = {
  q: string;
  stage: string;
  niche: string;
  city: string;
  websiteStatus: string;
  minScore: string;
};
