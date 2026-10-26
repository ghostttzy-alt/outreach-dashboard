// Sign-in and API access. Runs in middleware (edge runtime), so only Web Crypto is used here.
//  - Browsers sign in at /login and get a signed, httpOnly session cookie.
//  - Scripts (the daily Claude session) send "x-api-key: <API_KEY>".
//  - Netlify scheduled functions send "x-cron-secret", derived from the same server secret.

export const AUTH_COOKIE = "outreach_session";
export const SESSION_DAYS = 30;

/** Sign-in is always required in production. Locally it is on only when DASHBOARD_PASSWORD is set. */
export function authRequired() {
  return process.env.NODE_ENV === "production" || !!process.env.DASHBOARD_PASSWORD;
}

function serverSecret() {
  return process.env.SESSION_SECRET || process.env.DATABASE_URL || "dev-secret";
}

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(message: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(serverSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Cookie value: "<expiresAtMs>.<random>.<signature>". */
export async function createSessionToken(days = SESSION_DAYS) {
  const exp = Date.now() + days * 86_400_000;
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const payload = `${exp}.${nonce}`;
  return `${payload}.${await hmac(`session:${payload}`)}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  if (!(Number(exp) > Date.now())) return false;
  return safeEqual(sig, await hmac(`session:${exp}.${nonce}`));
}

/** Shared secret the Netlify scheduled functions send to /api/cron/*. */
export async function cronSecret() {
  return hmac("cron");
}

export function apiKeyValid(key: string | null | undefined) {
  const expected = process.env.API_KEY;
  return !!expected && !!key && safeEqual(key, expected);
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
