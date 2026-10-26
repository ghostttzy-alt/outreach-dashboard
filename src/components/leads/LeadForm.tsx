"use client";

import { STAGES, WEBSITE_STATUSES } from "@/lib/constants";
import { Field, Input, Select, Textarea } from "@/components/ui";

export type LeadFormValues = {
  businessName: string; niche: string; city: string; contactName: string; email: string; phone: string;
  website: string; websiteStatus: string; mainProblem: string; score: number; stage: string; notes: string;
};

export const EMPTY_LEAD: LeadFormValues = {
  businessName: "", niche: "", city: "", contactName: "", email: "", phone: "", website: "",
  websiteStatus: "None", mainProblem: "", score: 3, stage: "Queued", notes: "",
};

export function LeadForm({ values, onChange }: { values: LeadFormValues; onChange: (v: LeadFormValues) => void }) {
  const set = <K extends keyof LeadFormValues>(k: K, v: LeadFormValues[K]) => onChange({ ...values, [k]: v });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Business name *" className="sm:col-span-2">
        <Input required value={values.businessName} onChange={(e) => set("businessName", e.target.value)} autoFocus />
      </Field>
      <Field label="Niche"><Input value={values.niche} onChange={(e) => set("niche", e.target.value)} placeholder="Plumber" /></Field>
      <Field label="City"><Input value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin, TX" /></Field>
      <Field label="Contact name"><Input value={values.contactName} onChange={(e) => set("contactName", e.target.value)} /></Field>
      <Field label="Email"><Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Phone"><Input value={values.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      <Field label="Website"><Input value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="example.com" /></Field>
      <Field label="Website status">
        <Select value={values.websiteStatus} onChange={(e) => set("websiteStatus", e.target.value)}>
          {WEBSITE_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Score (1–5)">
        <Select value={values.score} onChange={(e) => set("score", Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
        </Select>
      </Field>
      <Field label="Main problem" className="sm:col-span-2">
        <Input value={values.mainProblem} onChange={(e) => set("mainProblem", e.target.value)} placeholder="Site isn't mobile friendly" />
      </Field>
      <Field label="Stage">
        <Select value={values.stage} onChange={(e) => set("stage", e.target.value)}>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <Textarea value={values.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-20" />
      </Field>
    </div>
  );
}
