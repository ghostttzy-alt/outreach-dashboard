"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TEMPLATE_VARIABLES } from "@/lib/constants";
import { renderTemplate } from "@/lib/templates";
import type { SettingsDTO, TemplateDTO } from "@/lib/types";
import { Button, Card, CardHeader, Field, Input, Modal, Textarea, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";

const SAMPLE_LEAD = {
  businessName: "Sunrise Bakery", contactName: "Elena Gomez", mainProblem: "no website, customers can't see hours or menu",
  city: "San Antonio, TX", niche: "bakery", website: "", mockupUrl: "https://mockups.example.com/sunrise-bakery",
};
const CORE_KEYS = ["first", "followup1", "followup2", "mockup"];

export function TemplatesLibrary({ templates, settings }: { templates: TemplateDTO[]; settings: SettingsDTO }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState<Partial<TemplateDTO> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const ordered = [...templates].sort((a, b) => {
    const ia = CORE_KEYS.indexOf(a.key), ib = CORE_KEYS.indexOf(b.key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const insert = (v: string) => {
    const el = bodyRef.current;
    if (!el || !editing) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const body = (editing.body ?? "").slice(0, start) + v + (editing.body ?? "").slice(end);
    setEditing({ ...editing, body });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  };

  const save = async () => {
    if (!editing) return;
    try {
      const body = { key: editing.key, name: editing.name, subject: editing.subject, body: editing.body };
      if (editing.id) await api(`/api/templates/${editing.id}`, { method: "PATCH", body });
      else await api("/api/templates", { method: "POST", body });
      toast("Template saved");
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const remove = async (t: TemplateDTO) => {
    const ok = await confirm({ title: `Delete “${t.name}”?`, message: "This template will be removed. Emails already written from it are not affected." });
    if (!ok) return;
    await api(`/api/templates/${t.id}`, { method: "DELETE" });
    toast("Template deleted");
    router.refresh();
  };

  return (
    <Card className="mt-4">
      <CardHeader
        title="Email templates"
        description="Variables like {business_name} are filled in when you write an email"
        action={
          <Button size="sm" onClick={() => setEditing({ key: "", name: "", subject: "", body: "" })}>
            <Plus className="size-3.5" /> New
          </Button>
        }
      />
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {ordered.map((t) => (
          <button
            key={t.id}
            onClick={() => { setEditing(t); setShowPreview(false); }}
            className="group rounded-lg border border-border p-4 text-left transition-colors hover:border-border-strong hover:bg-panel-2/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{t.name}</span>
              <code className="rounded bg-panel-2 px-1.5 py-0.5 text-[11px] text-muted">{t.key}</code>
            </div>
            <p className="mt-1.5 truncate text-sm text-muted">{t.subject}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted/80">{t.body}</p>
          </button>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit ${editing.name}` : "New template"} size="lg">
        {editing && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Key (used by the API)">
                <Input value={editing.key ?? ""} disabled={CORE_KEYS.includes(editing.key ?? "") && !!editing.id} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="e.g. breakup" />
              </Field>
            </div>
            <Field label="Subject"><Input value={editing.subject ?? ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></Field>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button key={v} type="button" onClick={() => insert(v)} className="rounded-md border border-border bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-muted hover:border-accent hover:text-fg">
                  {v}
                </button>
              ))}
            </div>
            {showPreview ? (
              <div className="rounded-lg border border-border bg-panel-2/50 p-3 text-sm">
                <p className="font-medium">{renderTemplate(editing.subject ?? "", SAMPLE_LEAD, settings)}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-muted">{renderTemplate(editing.body ?? "", SAMPLE_LEAD, settings)}</pre>
              </div>
            ) : (
              <Textarea ref={bodyRef} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="min-h-64 font-mono text-[13px]" />
            )}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPreview((p) => !p)}>{showPreview ? "Edit" : "Preview with sample lead"}</Button>
              {editing.id && !CORE_KEYS.includes(editing.key ?? "") && (
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-500" onClick={() => { const t = editing as TemplateDTO; setEditing(null); remove(t); }}>
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button onClick={() => setEditing(null)}>Cancel</Button>
                <Button variant="primary" onClick={save} disabled={!editing.name || !editing.key || !editing.subject || !editing.body}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
