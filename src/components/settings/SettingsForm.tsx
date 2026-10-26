"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RAMP } from "@/lib/constants";
import type { SettingsDTO } from "@/lib/types";
import { rampInfo } from "@/lib/utils";
import { Button, Card, CardHeader, Field, Input, PageHeader, Textarea, api } from "@/components/ui";
import { useToast } from "@/components/toast";

export function SettingsForm({ settings }: { settings: SettingsDTO }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState({
    yourName: settings.yourName,
    businessName: settings.businessName,
    mailingAddress: settings.mailingAddress,
    sendingEmail: settings.sendingEmail,
    setupPrice: String(settings.setupPrice),
    monthlyFee: String(settings.monthlyFee),
    dailyLimit: String(settings.dailyLimit),
    rampStartDate: settings.rampStartDate.slice(0, 10),
    followup1Days: String(settings.followup1Days),
    followup2Days: String(settings.followup2Days),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value });

  const ramp = s.rampStartDate ? rampInfo(new Date(`${s.rampStartDate}T12:00:00`), Number(s.dailyLimit) || 50) : null;

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
          followup1Days: Number(s.followup1Days),
          followup2Days: Number(s.followup2Days),
          rampStartDate: new Date(`${s.rampStartDate}T12:00:00`).toISOString(),
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
    <form onSubmit={save}>
      <PageHeader title="Settings" actions={<Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="You & your business" description="Used in email templates as {my_name}, {my_business} and {mailing_address}" />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <Field label="Your name"><Input value={s.yourName} onChange={set("yourName")} /></Field>
            <Field label="Business name"><Input value={s.businessName} onChange={set("businessName")} /></Field>
            <Field label="Sending email" className="sm:col-span-2"><Input type="email" value={s.sendingEmail} onChange={set("sendingEmail")} /></Field>
            <Field label="Mailing address (required in cold email footers)" className="sm:col-span-2">
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
          <CardHeader title="Sending limits" description={`Ramp: ${RAMP.map((n, i) => `week ${i + 1}${i === RAMP.length - 1 ? "+" : ""}: ${n}`).join(", ")} per day`} />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <Field label="Max daily limit"><Input type="number" min={1} value={s.dailyLimit} onChange={set("dailyLimit")} /></Field>
            <Field label="Ramp start date"><Input type="date" value={s.rampStartDate} onChange={set("rampStartDate")} /></Field>
            {ramp && (
              <p className="text-sm text-muted sm:col-span-2">
                Today is ramp week {ramp.week}, so your limit is <span className="font-medium text-fg">{ramp.limit} emails</span>
                {ramp.limit < ramp.rampLimit && " (capped by your max daily limit)"}.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Follow-up timing" description="When follow-ups show up as due in the queue" />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <Field label="Follow-up 1 after (days)"><Input type="number" min={1} value={s.followup1Days} onChange={set("followup1Days")} /></Field>
            <Field label="Follow-up 2 after (days)"><Input type="number" min={1} value={s.followup2Days} onChange={set("followup2Days")} /></Field>
          </div>
        </Card>
      </div>
    </form>
  );
}
