import {
  CLIENT_STATUSES,
  EMAIL_DIRECTIONS,
  EMAIL_STATUSES,
  EMAIL_TYPES,
  SITE_STATUSES,
  SITE_TYPES,
  STAGES,
  REPLY_CATEGORIES,
  WEBSITE_STATUSES,
} from "./constants";
import { isValidTimeZone } from "./utils";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Kind = "string" | "int" | "float" | "date" | "dateOrNull" | "bool" | "stringList" | "intList";
type FieldSpec = { kind: Kind; oneOf?: readonly string[]; min?: number; max?: number; check?: (v: string) => boolean; hint?: string };
type Spec = Record<string, FieldSpec>;

const str = (oneOf?: readonly string[]): FieldSpec => ({ kind: "string", oneOf });

export const LEAD_FIELDS: Spec = {
  businessName: str(),
  niche: str(),
  city: str(),
  contactName: str(),
  email: str(),
  phone: str(),
  website: str(),
  websiteStatus: str(WEBSITE_STATUSES),
  mainProblem: str(),
  score: { kind: "int", min: 1, max: 5 },
  stage: str(STAGES),
  dateContacted: { kind: "dateOrNull" },
  mockupUrl: str(),
  notes: str(),
  source: str(),
  sourceUrl: str(),
  createdBy: str(),
  runId: str(),
};

export const EMAIL_FIELDS: Spec = {
  leadId: str(),
  direction: str(EMAIL_DIRECTIONS),
  type: str(EMAIL_TYPES),
  subject: str(),
  body: str(),
  sentAt: { kind: "dateOrNull" },
  status: str(EMAIL_STATUSES),
  category: str(["", ...REPLY_CATEGORIES]),
};

export const SITE_FIELDS: Spec = {
  leadId: str(),
  type: str(SITE_TYPES),
  status: str(SITE_STATUSES),
  previewUrl: str(),
  liveUrl: str(),
  thumbnailUrl: str(),
};

export const CLIENT_FIELDS: Spec = {
  leadId: str(),
  setupPrice: { kind: "float", min: 0 },
  monthlyFee: { kind: "float", min: 0 },
  startDate: { kind: "date" },
  status: str(CLIENT_STATUSES),
};

export const COVERAGE_FIELDS: Spec = {
  city: str(),
  niche: str(),
  searchedAt: { kind: "date" },
  leadsFound: { kind: "int", min: 0 },
};

export const ACTIVITY_FIELDS: Spec = {
  leadId: str(),
  type: str(),
  description: str(),
  createdAt: { kind: "date" },
};

export const TEMPLATE_FIELDS: Spec = {
  key: str(),
  name: str(),
  subject: str(),
  body: str(),
};

export const SETTINGS_FIELDS: Spec = {
  yourName: str(),
  businessName: str(),
  mailingAddress: str(),
  sendingEmail: str(),
  setupPrice: { kind: "float", min: 0 },
  monthlyFee: { kind: "float", min: 0 },
  dailyLimit: { kind: "int", min: 1, max: 500 },
  rampSchedule: { kind: "intList", min: 1, max: 500 },
  rampStartDate: { kind: "date" },
  timezone: { kind: "string", check: isValidTimeZone, hint: "a time zone like America/New_York" },
  sendStartHour: { kind: "int", min: 0, max: 23 },
  sendEndHour: { kind: "int", min: 1, max: 24 },
  sendWeekends: { kind: "bool" },
  targetCities: { kind: "stringList" },
  targetNiches: { kind: "stringList" },
  chainBlocklist: { kind: "stringList" },
  followup1Days: { kind: "int", min: 1, max: 60 },
  followup2Days: { kind: "int", min: 1, max: 60 },
  coldAfterDays: { kind: "int", min: 1, max: 60 },
  paused: { kind: "bool" },
};

function coerce(key: string, value: unknown, spec: FieldSpec): unknown {
  switch (spec.kind) {
    case "string": {
      const s = value == null ? "" : String(value).trim();
      if (spec.oneOf && !spec.oneOf.includes(s)) {
        throw new ApiError(400, `${key} must be one of: ${spec.oneOf.join(", ")}`);
      }
      if (spec.check && !spec.check(s)) throw new ApiError(400, `${key} must be ${spec.hint ?? "valid"}`);
      return s;
    }
    case "int":
    case "float": {
      const n = spec.kind === "int" ? Math.round(Number(value)) : Number(value);
      if (!Number.isFinite(n)) throw new ApiError(400, `${key} must be a number`);
      if (spec.min !== undefined && n < spec.min) throw new ApiError(400, `${key} must be at least ${spec.min}`);
      if (spec.max !== undefined && n > spec.max) throw new ApiError(400, `${key} must be at most ${spec.max}`);
      return n;
    }
    case "bool": {
      if (typeof value === "boolean") return value;
      if (value === "true" || value === 1) return true;
      if (value === "false" || value === 0) return false;
      throw new ApiError(400, `${key} must be true or false`);
    }
    case "stringList": {
      // One item per line (commas are allowed inside an item, e.g. "Austin, TX").
      const list = Array.isArray(value) ? value : String(value ?? "").split("\n");
      return [...new Set(list.map((v) => String(v).trim()).filter(Boolean))];
    }
    case "intList": {
      const list = Array.isArray(value) ? value : String(value ?? "").split(/[\s,]+/).filter(Boolean);
      if (!list.length) throw new ApiError(400, `${key} needs at least one number`);
      return list.map((v, i) => coerce(`${key}[${i}]`, v, { kind: "int", min: spec.min, max: spec.max }));
    }
    case "date":
    case "dateOrNull": {
      if (value === null || value === "") {
        if (spec.kind === "dateOrNull") return null;
        throw new ApiError(400, `${key} is required`);
      }
      const d = new Date(value as string);
      if (Number.isNaN(d.getTime())) throw new ApiError(400, `${key} must be a valid date`);
      return d;
    }
  }
}

/** Keep only known fields, coerce types and check enum values. Unknown keys are ignored. */
export function pickFields(body: unknown, spec: Spec, required: string[] = []) {
  if (!body || typeof body !== "object") throw new ApiError(400, "Request body must be a JSON object");
  const input = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, fieldSpec] of Object.entries(spec)) {
    if (input[key] !== undefined) out[key] = coerce(key, input[key], fieldSpec);
  }
  for (const key of required) {
    if (out[key] === undefined || out[key] === "") throw new ApiError(400, `${key} is required`);
  }
  return out;
}
