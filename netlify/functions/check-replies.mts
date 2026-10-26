// Netlify scheduled function: every 30 minutes, ask the site to check Gmail for replies and bounces.
// The secret must match cronSecret() in src/lib/auth.ts: HMAC-SHA256("cron") keyed with SESSION_SECRET, else DATABASE_URL.

async function cronSecret() {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL || "dev-secret";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("cron"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export default async (_req: Request, context: { site?: { url?: string } }) => {
  const base = process.env.URL || context.site?.url;
  if (!base) return new Response("Site URL unknown", { status: 500 });
  const res = await fetch(`${base}/api/cron/replies`, { method: "POST", headers: { "x-cron-secret": await cronSecret() } });
  console.log(`/api/cron/replies → ${res.status} ${(await res.text()).slice(0, 500)}`);
  return new Response(null, { status: res.ok ? 200 : 500 });
};

export const config = { schedule: "*/30 * * * *" };
