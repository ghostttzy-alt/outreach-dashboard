"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  options?: readonly string[];
  type?: "text" | "email" | "url" | "date" | "textarea";
  display?: React.ReactNode;
  placeholder?: string;
  className?: string;
};

/** Click to edit; Enter or blur saves, Escape cancels. */
export function EditableField({ label, value, onSave, options, type = "text", display, placeholder = "Add…", className }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = async (next = draft) => {
    setEditing(false);
    if (next === value) return;
    setSaving(true);
    try {
      await onSave(next);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-accent bg-panel px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

  return (
    <div className={cn("group min-w-0", className)}>
      <div className="mb-0.5 text-xs text-muted">{label}</div>
      {editing ? (
        options ? (
          <select ref={ref} value={draft} className={inputClass} onChange={(e) => { setDraft(e.target.value); commit(e.target.value); }} onBlur={() => setEditing(false)}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : type === "textarea" ? (
          <textarea
            ref={ref}
            value={draft}
            rows={3}
            className={inputClass}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit()}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
            }}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            value={draft}
            className={inputClass}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-panel-2",
            saving && "opacity-50",
          )}
        >
          <span className={cn("min-w-0 flex-1 break-words", !value && "text-muted/70")}>{value ? display ?? value : placeholder}</span>
          <Pencil className="size-3 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
