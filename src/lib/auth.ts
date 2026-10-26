// Optional password protection, enabled when DASHBOARD_PASSWORD is set (e.g. on Netlify).
// Browsers sign in at /login and get a cookie; scripts send "Authorization: Bearer <API_TOKEN>".

export const AUTH_COOKIE = "outreach_session";

export function authEnabled() {
  return !!process.env.DASHBOARD_PASSWORD;
}

/** The cookie holds a hash of the password, so changing the password signs everyone out. */
export async function sessionToken(password = process.env.DASHBOARD_PASSWORD ?? "") {
  const data = new TextEncoder().encode(`outreach-dashboard:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
