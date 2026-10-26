"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Mail, PauseCircle, PlayCircle, ShieldAlert, Trash2 } from "lucide-react";
import type { SettingsDTO } from "@/lib/types";
import { cn, formatDate, formatDateTime, rampInfo, timeAgo } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";

type System = {
  gmailConfigured: boolean;
  gmailEmail: string;
  gmailConnectedAt: string | null;
  gmailError: string;
  connected: boolean;
  redirectUri: string;
  apiKeySet: boolean;
  lastReplyCheckAt: string | null;
  lastSendTickAt: string | null;
};
type DncEntry = { id: string; email: string; reason: string; createdAt: string };

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "America/Vancouver", "Europe/London",
  "Europe/Dublin", "Europe/Berlin", "Europe/Paris", "Australia/Sydney", "Asia/Kolkata", "UTC",
];
const hourLabel = (h: number) => (h === 0 || h === 24 ? "12 AM" : h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`);

export function SettingsForm({ settings, system, dnc }: { settings: SettingsDTO; system: System; dnc: DncEntry[] }) {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const [s, setS] = useState({
    yourName: settings.yourName,
    businessName: settings.businessName,
    mailingAddress: settings.mailingAddress,
    sendingEmail: settings.sendingEmail,
    setupPrice: String(settings.setupPrice),
    monthlyFee: String(settings.monthlyFee),
    dailyLimit: String(settings.dailyLimit),
    rampSchedule: settings.rampSchedule.join(", "),
    rampStartDate: settings.rampStartDate.slice(0, 10),
    timezone: settings.timezone,
    sendStartHour: String(settings.sendStartHour),
    sendEndHour: String(settings.sendEndHour),
    sendWeekends: settings.sendWeekends,
    targetCities: settings.targetCities.join("\n"),
    targetNiches: settings.targetNiches.join("\n"),
    chainBlocklist: settings.chainBlocklist.join("\n"),
    followup1Days: String(settings.followup1Days),
    followup2Days: String(settings.followup2Days),
    coldAfterDays: String(settings.coldAfterDays),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setS({ ...s, [k]: e.target.value });

  // Feedback after returning from Google's consent screen.
  useEffect(() => {
    const g = params.get("gmail");
    if (!g) return;
    if (g === "connected") toast("Gmail connected");
    else if (g === "not_configured") toast("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Netlify first", "error");
    else toast(`Gmail not connected: ${params.get("detail") ?? g}`, "error");
    router.replace("/settings#gmail");
  }, [params, router, toast]);

  const schedule = s.rampSchedule.split(/[\s,]+/).map(Number).filter((n) => n > 0);
  const ramp = s.rampStartDate && schedule.length
    ? rampInfo({ rampStartDate: new Date(`${s.rampStartDate}T12:00:00Z`), dailyLimit: Number(s.dailyLimit) || 50, rampSchedule: schedule, timezone: s.timezone })
    : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: {
          ...s,
          setupPrice: Number(s.setupPrice),
          monthlyFee: Number(s.monthlyFee),
          dailyLimit: Number(s.dailyLimit),
          rampSchedule: schedule,
          sendStartHour: Number(s.sendStartHour),
          sendEndHour: Number(s.sendEndHour),
          followup1Days: Number(s.followup1Days),
          followup2Days: Number(s.followup2Days),
          coldAfterDays: Number(s.coldAfterDays),
          targetCities: s.targetCities.split("\n"),
          targetNiches: s.targetNiches.split("\n"),
          chainBlocklist: s.chainBlocklist.split("\n"),
          rampStartDate: new Date(`${s.rampStartDate}T12:00:00Z`).toISOString(),
        },
      });
      toast("Settings saved");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={save}>
        <PageHeader title="Settings" actions={<Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>} />
        <PauseSwitch settings={settings} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="You & your business" description="Used in emails and on mockup previews" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Your name"><Input value={s.yourName} onChange={set("yourName")} /></Field>
              <Field label="Business name"><Input value={s.businessName} onChange={set("businessName")} /></Field>
              <Field label="Sending email" className="sm:col-span-2"><Input type="email" value={s.sendingEmail} onChange={set("sendingEmail")} placeholder={system.gmailEmail || "you@gmail.com"} /></Field>
              <Field label="Mailing address (added to cold emails if missing)" className="sm:col-span-2">
                <Textarea value={s.mailingAddress} onChange={set("mailingAddress")} className="min-h-20" />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Pricing" description="Defaults for new clients when a lead is marked Won" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Setup price ($)"><Input type="number" min={0} value={s.setupPrice} onChange={set("setupPrice")} /></Field>
              <Field label="Monthly fee ($)"><Input type="number" min={0} value={s.monthlyFee} onChange={set("monthlyFee")} /></Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Sending limits" description="Follow-ups and replies count toward the daily limit" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Max daily limit"><Input type="number" min={1} value={s.dailyLimit} onChange={set("dailyLimit")} /></Field>
              <Field label="Ramp start date"><Input type="date" value={s.rampStartDate} onChange={set("rampStartDate")} /></Field>
              <Field label="Ramp per week (week 1, 2, 3, 4+)" className="sm:col-span-2">
                <Input value={s.rampSchedule} onChange={set("rampSchedule")} placeholder="20, 30, 40, 50" />
              </Field>
              {ramp && (
                <p className="text-sm text-muted sm:col-span-2">
                  Today is ramp week {ramp.week}, so the limit is <span className="font-medium text-fg">{ramp.limit} emails</span>
                  {ramp.limit < ramp.rampLimit && " (capped by your max daily limit)"}.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Sending hours" description="Approved emails go out one at a time, 2–6 minutes apart, inside these hours" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Time zone" className="sm:col-span-2">
                <Select value={s.timezone} onChange={set("timezone")}>
                  {[...new Set([s.timezone, ...TIMEZONES])].map((tz) => <option key={tz}>{tz}</option>)}
                </Select>
              </Field>
              <Field label="From">
                <Select value={s.sendStartHour} onChange={set("sendStartHour")}>
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                </Select>
              </Field>
              <Field label="Until">
                <Select value={s.sendEndHour} onChange={set("sendEndHour")}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                </Select>
              </Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={s.sendWeekends} onChange={(e) => setS({ ...s, sendWeekends: e.target.checked })} className="size-4 accent-[var(--accent)]" />
                Also send on weekends
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader title="Targets" description="One per line. The daily session reads these from /api/brief" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Target cities"><Textarea value={s.targetCities} onChange={set("targetCities")} placeholder={"Austin, TX\nRound Rock, TX"} /></Field>
              <Field label="Target niches"><Textarea value={s.targetNiches} onChange={set("targetNiches")} placeholder={"Plumber\nRoofer"} /></Field>
              <Field label="Chain / franchise blocklist (leads whose name contains these are rejected)" className="sm:col-span-2">
                <Textarea value={s.chainBlocklist} onChange={set("chainBlocklist")} placeholder={"Roto-Rooter\nMr. Rooter\nServiceMaster"} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Follow-up timing" description="When follow-ups become due for the daily session to write" />
            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <Field label="Follow-up 1 (days after first)"><Input type="number" min={1} value={s.followup1Days} onChange={set("followup1Days")} /></Field>
              <Field label="Follow-up 2 (days after FU 1)"><Input type="number" min={1} value={s.followup2Days} onChange={set("followup2Days")} /></Field>
              <Field label="Mark Cold (days after FU 2)"><Input type="number" min={1} value={s.coldAfterDays} onChange={set("coldAfterDays")} /></Field>
            </div>
          </Card>
        </div>
      </form>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GmailCard system={system} />
        <SecurityCard apiKeySet={system.apiKeySet} />
        <DncCard entries={dnc} />
      </div>
    </>
  );
}

function PauseSwitch({ settings }: { settings: SettingsDTO }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (settings.paused && settings.pausedReason.startsWith("Bounce rate")) {
      const ok = await confirm({ title: "Resume sending?", message: "Sending was paused because too many emails bounced. Check your lead emails first. Resume anyway?", confirmLabel: "Resume" });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await api("/api/settings", { method: "PATCH", body: { paused: !settings.paused } });
      toast(settings.paused ? "Outreach resumed" : "All outreach paused");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className={cn("mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5", settings.paused && "border-red-500/40 bg-red-500/10")}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          {settings.paused ? <PauseCircle className="size-4 text-red-500" /> : <PlayCircle className="size-4 text-emerald-500" />}
          {settings.paused ? "All outreach is paused" : "Outreach is running"}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {settings.paused
            ? `${settings.pausedReason || "Paused"}${settings.pausedAt ? ` · since ${formatDateTime(settings.pausedAt)}` : ""}. Nothing is sent while paused.`
            : "Approved emails are being sent during your sending hours."}
        </p>
      </div>
      <Button type="button" variant={settings.paused ? "primary" : "danger"} onClick={toggle} disabled={busy}>
        {settings.paused ? "Resume outreach" : "Pause all outreach"}
      </Button>
    </Card>
  );
}

function GmailCard({ system }: { system: System }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [checking, setChecking] = useState(false);
  const ok = system.connected && !system.gmailError;

  const disconnect = async () => {
    if (!(await confirm({ title: "Disconnect Gmail?", message: "Sending and reply checking stop until you connect again.", confirmLabel: "Disconnect" }))) return;
    await api("/api/gmail/disconnect", { method: "POST" });
    toast("Gmail disconnected");
    router.refresh();
  };
  const checkNow = async () => {
    setChecking(true);
    try {
      const { data } = await api<{ data: { replies: number; bounces: number; error: string } }>("/api/cron/replies", { method: "POST" });
      if (data.error) toast(data.error, "error");
      else toast(`Checked: ${data.replies} new repl${data.replies === 1 ? "y" : "ies"}, ${data.bounces} bounce(s)`);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card id="gmail">
      <CardHeader title="Gmail" description="Sends approved emails and checks for replies every 30 minutes" />
      <div className="space-y-3 p-4 text-sm sm:p-5">
        {!system.gmailConfigured ? (
          <p className="text-muted">Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in Netlify&apos;s environment variables, redeploy, then come back here to connect.</p>
        ) : ok ? (
          <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" /> Connected as <span className="font-medium">{system.gmailEmail}</span>{system.gmailConnectedAt && <span className="text-muted">· {formatDate(system.gmailConnectedAt)}</span>}</p>
        ) : (
          <p className="flex items-start gap-2 text-red-600 dark:text-red-400"><ShieldAlert className="mt-0.5 size-4 shrink-0" /> {system.gmailError || "Not connected. Nothing can be sent until you connect Gmail."}</p>
        )}
        {system.gmailConfigured && (
          <div className="flex flex-wrap gap-2">
            <a href="/api/gmail/connect"><Button type="button" variant={ok ? "secondary" : "primary"}><Mail className="size-4" /> {system.connected ? "Reconnect Gmail" : "Connect Gmail"}</Button></a>
            {system.connected && <Button type="button" variant="ghost" onClick={disconnect}>Disconnect</Button>}
            {ok && <Button type="button" variant="ghost" onClick={checkNow} disabled={checking}>{checking ? "Checking…" : "Check replies now"}</Button>}
          </div>
        )}
        <div className="rounded-lg border border-border bg-panel-2/40 p-3 text-xs text-muted">
          <p>Redirect URI to paste into Google Cloud:</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-fg">{system.redirectUri}</code>
            <button type="button" className="hover:text-fg" aria-label="Copy" onClick={() => { navigator.clipboard.writeText(system.redirectUri); toast("Copied"); }}><Copy className="size-3.5" /></button>
          </div>
          <p className="mt-2">Last reply check: {system.lastReplyCheckAt ? timeAgo(system.lastReplyCheckAt) : "never"} · Last send check: {system.lastSendTickAt ? timeAgo(system.lastSendTickAt) : "never"}</p>
        </div>
      </div>
    </Card>
  );
}

function SecurityCard({ apiKeySet }: { apiKeySet: boolean }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/password", { method: "POST", body: { current, next } });
      toast("Password changed");
      setCurrent("");
      setNext("");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader title="Security" />
      <div className="space-y-4 p-4 text-sm sm:p-5">
        <p className="flex items-center gap-2">
          API key for the daily session:{" "}
          {apiKeySet ? <Badge color="green">Set</Badge> : <Badge color="red">Missing</Badge>}
          {!apiKeySet && <span className="text-xs text-muted">Add API_KEY in Netlify</span>}
        </p>
        <form onSubmit={change} className="grid gap-3 sm:grid-cols-2">
          <Field label="Current password"><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></Field>
          <Field label="New password (10+ characters)"><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></Field>
          <div className="sm:col-span-2"><Button type="submit" disabled={busy || !current || next.length < 10}>Change password</Button></div>
        </form>
      </div>
    </Card>
  );
}

function DncCard({ entries }: { entries: DncEntry[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [email, setEmail] = useState("");
  const [filter, setFilter] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/dnc", { method: "POST", body: { email, reason: "Added manually" } });
      setEmail("");
      toast("Added to Do Not Contact");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };
  const remove = async (d: DncEntry) => {
    if (!(await confirm({ title: `Remove ${d.email}?`, message: "This address could be emailed again. Leads still marked Do Not Contact stay locked until you change their stage." }))) return;
    await api(`/api/dnc/${d.id}`, { method: "DELETE" });
    router.refresh();
  };
  const shown = entries.filter((d) => !filter || d.email.includes(filter.toLowerCase()));
  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Do Not Contact list" description={`${entries.length} address${entries.length === 1 ? "" : "es"}. Checked when leads and drafts are added, and again right before every send.`} />
      <div className="space-y-3 p-4 sm:p-5">
        <form onSubmit={add} className="flex gap-2">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@business.com" />
          <Button type="submit" disabled={!email}>Add</Button>
        </form>
        {entries.length > 10 && <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…" />}
        {shown.length > 0 && (
          <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border text-sm">
            {shown.slice(0, 200).map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate">{d.email}</span>
                <span className="hidden truncate text-xs text-muted sm:block">{d.reason} · {formatDate(d.createdAt)}</span>
                <button type="button" onClick={() => remove(d)} className="text-muted hover:text-red-500" aria-label={`Remove ${d.email}`}><Trash2 className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
