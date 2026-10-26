import { prisma } from "./prisma";
import { decrypt, encrypt } from "./crypto";
import { getState } from "./settings";

// Gmail over plain REST calls (no SDK). Scopes: send mail, and read mail to find replies and bounces.
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];

// Overridable only so the send/reply flow can be tested against a local fake.
const API = process.env.GMAIL_API_BASE || "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";

export class GmailAuthError extends Error {}

type Tokens = { access_token: string; refresh_token: string; expires_at: number };

export function gmailConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** The public origin of this site, as the browser sees it. */
export function publicOrigin(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function redirectUri(origin: string) {
  return `${origin}/api/gmail/callback`;
}

export function authUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      ...body,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = `${json.error ?? res.status}${json.error_description ? `: ${json.error_description}` : ""}`;
    if (json.error === "invalid_grant" || json.error === "invalid_client" || json.error === "unauthorized_client") throw new GmailAuthError(msg);
    throw new Error(`Google token request failed (${msg})`);
  }
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

/** Finish the OAuth flow: exchange the code, look up the address, save encrypted tokens. */
export async function connectGmail(code: string, origin: string) {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  if (!t.refresh_token) throw new Error("Google didn't return a refresh token. Remove the app's access at myaccount.google.com/permissions and connect again.");
  const tokens: Tokens = { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: Date.now() + t.expires_in * 1000 };
  const profile = await gmailFetch<{ emailAddress: string; historyId: string }>("/profile", {}, tokens.access_token);
  await prisma.systemState.upsert({
    where: { id: 1 },
    update: { gmailTokens: encrypt(JSON.stringify(tokens)), gmailEmail: profile.emailAddress, gmailConnectedAt: new Date(), gmailError: "" },
    create: { id: 1, gmailTokens: encrypt(JSON.stringify(tokens)), gmailEmail: profile.emailAddress, gmailConnectedAt: new Date() },
  });
  return profile.emailAddress;
}

export async function disconnectGmail() {
  const state = await getState();
  if (state.gmailTokens) {
    try {
      const tokens = JSON.parse(decrypt(state.gmailTokens)) as Tokens;
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokens.refresh_token)}`, { method: "POST" });
    } catch {
      // Revoking is best effort; the tokens are deleted either way.
    }
  }
  await prisma.systemState.update({ where: { id: 1 }, data: { gmailTokens: "", gmailEmail: "", gmailConnectedAt: null, gmailError: "" } });
}

async function markDisconnected(message: string) {
  await prisma.systemState.update({ where: { id: 1 }, data: { gmailError: message } });
}

/** A valid access token, refreshed when needed. Throws GmailAuthError when Gmail must be reconnected. */
export async function accessToken() {
  const state = await getState();
  if (!state.gmailTokens) throw new GmailAuthError("Gmail is not connected");
  if (state.gmailError) throw new GmailAuthError(state.gmailError);
  let tokens: Tokens;
  try {
    tokens = JSON.parse(decrypt(state.gmailTokens));
  } catch {
    await markDisconnected("Saved Gmail tokens can't be read (the Google client secret changed?). Reconnect Gmail in Settings.");
    throw new GmailAuthError("Gmail tokens unreadable");
  }
  if (tokens.expires_at > Date.now() + 60_000) return tokens.access_token;
  try {
    const t = await tokenRequest({ refresh_token: tokens.refresh_token, grant_type: "refresh_token" });
    const next: Tokens = { access_token: t.access_token, refresh_token: t.refresh_token ?? tokens.refresh_token, expires_at: Date.now() + t.expires_in * 1000 };
    await prisma.systemState.update({ where: { id: 1 }, data: { gmailTokens: encrypt(JSON.stringify(next)) } });
    return next.access_token;
  } catch (err) {
    if (err instanceof GmailAuthError) {
      await markDisconnected("Google stopped accepting the saved Gmail access (it expired or was revoked). Reconnect Gmail in Settings.");
    }
    throw err;
  }
}

export async function gmailFetch<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token ?? (await accessToken())}`, "Content-Type": "application/json", ...init.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) throw new GmailAuthError("Gmail rejected the access token");
  if (!res.ok) throw new Error(`Gmail API ${res.status}: ${json.error?.message ?? "request failed"}`);
  return json as T;
}

// ---------- Sending ----------

function encodeHeader(value: string) {
  const clean = value.replace(/[\r\n]+/g, " ").trim();
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

export type OutgoingMail = {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
};

export function buildMime(m: OutgoingMail) {
  const from = m.fromName ? `${encodeHeader(m.fromName.replace(/["<>]/g, ""))} <${m.from}>` : m.from;
  const headers = [
    `From: ${from}`,
    `To: ${m.to.replace(/[\r\n,;]/g, "")}`,
    `Subject: ${encodeHeader(m.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    `List-Unsubscribe: <mailto:${m.from}?subject=unsubscribe>`,
  ];
  if (m.inReplyTo) headers.push(`In-Reply-To: ${m.inReplyTo}`);
  if (m.references) headers.push(`References: ${m.references}`);
  const body = Buffer.from(m.body.replace(/\r?\n/g, "\r\n"), "utf8").toString("base64").replace(/.{76}/g, "$&\r\n");
  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

export async function sendMail(m: OutgoingMail) {
  const raw = Buffer.from(buildMime(m), "utf8").toString("base64url");
  const sent = await gmailFetch<{ id: string; threadId: string }>("/messages/send", {
    method: "POST",
    body: JSON.stringify(m.threadId ? { raw, threadId: m.threadId } : { raw }),
  });
  // Read back the Message-ID header Gmail assigned, so follow-ups can reference it.
  let rfcMessageId = "";
  try {
    const meta = await gmailFetch<GmailMessage>(`/messages/${sent.id}?format=metadata&metadataHeaders=Message-ID`);
    rfcMessageId = header(meta, "Message-ID");
  } catch {
    // Not fatal: the follow-up will still go into the same thread via threadId.
  }
  return { id: sent.id, threadId: sent.threadId, rfcMessageId };
}

// ---------- Reading ----------

type Part = { mimeType?: string; filename?: string; headers?: { name: string; value: string }[]; body?: { data?: string; size?: number }; parts?: Part[] };
export type GmailMessage = { id: string; threadId: string; labelIds?: string[]; snippet?: string; internalDate?: string; payload?: Part };

export function header(msg: GmailMessage, name: string) {
  const h = msg.payload?.headers?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

function decodePart(data?: string) {
  return data ? Buffer.from(data, "base64url").toString("utf8") : "";
}

function htmlToText(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The plain-text body of a message (falls back to the HTML part converted to text). */
export function messageText(msg: GmailMessage) {
  let plain = "";
  let html = "";
  const walk = (p?: Part) => {
    if (!p) return;
    if (p.filename) return; // attachments
    if (p.mimeType === "text/plain" && !plain) plain = decodePart(p.body?.data);
    else if (p.mimeType === "text/html" && !html) html = decodePart(p.body?.data);
    p.parts?.forEach(walk);
  };
  walk(msg.payload);
  return (plain || htmlToText(html) || msg.snippet || "").replace(/\r\n/g, "\n").trim();
}

export async function listMessageIds(q: string, max = 300) {
  const out: { id: string; threadId: string }[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ q, maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await gmailFetch<{ messages?: { id: string; threadId: string }[]; nextPageToken?: string }>(`/messages?${params}`);
    out.push(...(page.messages ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken && out.length < max);
  return out;
}

export async function getMessage(id: string) {
  return gmailFetch<GmailMessage>(`/messages/${id}?format=full`);
}
