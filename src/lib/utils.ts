import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { RAMP } from "./constants";

// Teach tailwind-merge about the theme colors so e.g. "bg-panel" and "bg-panel-2" conflict correctly.
const twMerge = extendTailwindMerge({
  extend: {
    theme: { color: ["bg", "panel", "panel-2", "border", "border-strong", "fg", "muted", "accent", "accent-fg"] },
  },
});

/** Join class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function startOfToday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date) {
  return Math.floor((startOfToday(b).getTime() - startOfToday(a).getTime()) / 86_400_000);
}

/** Calendar parts of `date` as seen in time zone `tz` (e.g. "America/New_York"). */
export function zonedParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour % 24, minute: +p.minute, second: +p.second, weekday: p.weekday as string };
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Days since 1970-01-01 for the calendar date of `date` in `tz`. */
export function dayNumber(date: Date, tz: string) {
  const p = zonedParts(date, tz);
  return Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86_400_000);
}

function offsetMs(date: Date, tz: string) {
  const p = zonedParts(date, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** Midnight at the start of `date`'s calendar day in `tz`, `addDays` days later. */
export function startOfDayInTz(date: Date, tz: string, addDays = 0) {
  const p = zonedParts(date, tz);
  const utcMidnight = Date.UTC(p.year, p.month - 1, p.day + addDays);
  const guess = utcMidnight - offsetMs(new Date(utcMidnight), tz);
  return new Date(utcMidnight - offsetMs(new Date(guess), tz));
}

/** Today's send limit from the ramp (e.g. week 1: 20, week 2: 30, ...), capped by the max daily limit. */
export function rampInfo(
  s: { rampStartDate: Date | string; dailyLimit: number; rampSchedule: number[]; timezone: string },
  now = new Date(),
) {
  const schedule = s.rampSchedule.length ? s.rampSchedule : RAMP;
  const days = Math.max(0, dayNumber(now, s.timezone) - dayNumber(new Date(s.rampStartDate), s.timezone));
  const week = Math.floor(days / 7) + 1;
  const rampLimit = schedule[Math.min(week - 1, schedule.length - 1)];
  return { week, rampLimit, limit: Math.min(rampLimit, s.dailyLimit) };
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(d: Date | string | null | undefined) {
  if (!d) return "—";
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function firstName(contactName: string) {
  return contactName.trim().split(/\s+/)[0] || "there";
}

export function ensureUrl(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 1000) / 10;
}
