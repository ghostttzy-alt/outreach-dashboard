"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { EMAIL_TYPES, EMAIL_TYPE_LABELS } from "@/lib/constants";
import { renderTemplate } from "@/lib/templates";
import type { EmailDTO, LeadDTO, SettingsDTO, TemplateDTO } from "@/lib/types";
import { Button, Field, Input, Modal, Select, Textarea, api } from "./ui";
import { useToast } from "./toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  lead: LeadDTO;
  templates: TemplateDTO[];
  settings: SettingsDTO | null;
  /** Pre-select a template key (e.g. "followup1"). */
  initialType?: string;
  /** Edit an existing draft instead of creating a new email. */
  draft?: EmailDTO | null;
};

/**
 * Compose an outbound email from a template. It goes into the Approval Queue (or straight to approved),
 * and the scheduler sends it through Gmail within the daily limit.
 */
export function EmailComposer({ open, onClose, onSaved, lead, templates, settings, initialType, draft }: Props) {
  const toast = useToast();
  const [type, setType] = useState(initialType ?? "first");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const applyTemplate = useMemo(
    () => (t: string) => {
      const tpl = templates.find((x) => x.key === t);
      setSubject(tpl ? renderTemplate(tpl.subject, lead, settings) : "");
      setBody(tpl ? renderTemplate(tpl.body, lead, settings) : "");
    },
    [templates, lead, settings],
  );

  useEffect(() => {
    if (!open) return;
    setError("");
    if (draft) {
      setType(draft.type);
      setSubject(draft.subject);
      setBody(draft.body);
    } else {
      const t = initialType ?? "first";
      setType(t);
      applyTemplate(t);
    }
  }, [open, draft, initialType, applyTemplate]);

  const dnc = lead.stage === "Do Not Contact";

  const save = async (status: "draft" | "approved") => {
    setBusy(true);
    setError("");
    try {
      if (draft) await api(`/api/emails/${draft.id}`, { method: "PATCH", body: { type, subject, body, status } });
      else await api("/api/emails", { method: "POST", body: { leadId: lead.id, direction: "outbound", type, subject, body, status } });
      toast(status === "draft" ? "Added to the approval queue" : `${EMAIL_TYPE_LABELS[type]} to ${lead.businessName} approved; it will send shortly`);
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Email ${lead.businessName}`} size="lg">
      {dnc ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          This lead is marked Do Not Contact. Outbound email is locked.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <Field label="Type">
              <Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (!draft) applyTemplate(e.target.value);
                }}
              >
                {EMAIL_TYPES.map((t) => <option key={t} value={t}>{EMAIL_TYPE_LABELS[t]}</option>)}
              </Select>
            </Field>
            <Field label="To">
              <Input value={lead.email || "No email on file"} readOnly className="text-muted" />
            </Field>
          </div>
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Body">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-64 font-mono text-[13px]" />
          </Field>
          {draft && (
            <button type="button" className="text-xs text-muted underline hover:text-fg" onClick={() => applyTemplate(type)}>
              Reset to template
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {!dnc && (
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
              toast("Copied to clipboard");
            }}
          >
            <Copy className="size-4" /> Copy
          </Button>
          <Button type="button" disabled={busy || !lead.email} onClick={() => save("draft")}>Add to approval queue</Button>
          <Button type="button" variant="primary" disabled={busy || !lead.email} onClick={() => save("approved")}>Approve & send</Button>
        </div>
      )}
    </Modal>
  );
}
