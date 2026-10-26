import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { gmailConfigured, redirectUri } from "@/lib/gmail";
import { getSettings, getState } from "@/lib/services";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, state, dnc] = await Promise.all([
    getSettings(),
    getState(),
    prisma.doNotContact.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
  ]);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const system = {
    gmailConfigured: gmailConfigured(),
    gmailEmail: state.gmailEmail,
    gmailConnectedAt: state.gmailConnectedAt,
    gmailError: state.gmailError,
    connected: !!state.gmailTokens,
    redirectUri: redirectUri(origin),
    apiKeySet: !!process.env.API_KEY,
    lastReplyCheckAt: state.lastReplyCheckAt,
    lastSendTickAt: state.lastSendTickAt,
  };
  return <SettingsForm settings={JSON.parse(JSON.stringify(settings))} system={JSON.parse(JSON.stringify(system))} dnc={JSON.parse(JSON.stringify(dnc))} />;
}
