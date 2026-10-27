import type { Email, Lead } from "@prisma/client";
import { sendMail } from "./gmail";
import { stripQuoted } from "./replies";
import { logActivity } from "./services";
import { getSettings, getState } from "./settings";

// Reply alerts: the moment a business writes back, email the user so they can answer fast.
// Sent from the connected Gmail to Settings.alertEmail (or to itself). Self-sent mail is "from:me",
// so reply checking never mistakes an alert for a reply.

const NO_ALERT = ["Unsubscribe", "Not interested", "Auto-reply", "Bounce"];

function appUrl() {
  return (process.env.APP_URL || process.env.URL || "").replace(/\/+$/, "");
}

export function alertText(reply: Pick<Email, "subject" | "body">, lead: Lead, base = appUrl()) {
  const said = stripQuoted(reply.body).slice(0, 1500) || "(no text)";
  const lines = [
    `${lead.businessName} just replied${lead.city ? ` (${lead.city})` : ""}.`,
    "",
    `"${said}"`,
    "",
    `Subject: ${reply.subject || "(no subject)"}`,
    lead.phone ? `Phone: ${lead.phone}` : "",
    lead.mockupUrl ? `Their mockup: ${lead.mockupUrl}` : "",
    base ? `Open the lead: ${base}/leads/${lead.id}` : "",
    "",
    "Reply in the same Gmail thread so it stays connected. Fast answers win clients.",
  ];
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n").trim();
}

/** Never throws: a failed alert must not break reply checking. */
export async function sendReplyAlert(reply: Email, lead: Lead) {
  if (NO_ALERT.includes(reply.category)) return false;
  try {
    const [settings, state] = await Promise.all([getSettings(), getState()]);
    if (!settings.alertsEnabled || !state.gmailEmail) return false;
    const to = settings.alertEmail.trim() || state.gmailEmail;
    await sendMail({
      from: state.gmailEmail,
      fromName: "Outreach alerts",
      to,
      subject: `New reply: ${lead.businessName}`,
      body: alertText(reply, lead),
    });
    return true;
  } catch (err) {
    await logActivity(lead.id, "alert_failed", `Couldn't send the reply alert for ${lead.businessName}: ${(err as Error).message}`).catch(() => {});
    return false;
  }
}
