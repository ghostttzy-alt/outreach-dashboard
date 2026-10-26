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

/** Today's send limit from the ramp (week 1: 20, week 2: 30, ...), capped by the settings limit. */
export function rampInfo(rampStartDate: Date, dailyLimit: number, now = new Date()) {
  const days = Math.max(0, daysBetween(rampStartDate, now));
  const week = Math.floor(days / 7) + 1;
  const rampLimit = RAMP[Math.min(week - 1, RAMP.length - 1)];
  return { week, rampLimit, limit: Math.min(rampLimit, dailyLimit) };
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
