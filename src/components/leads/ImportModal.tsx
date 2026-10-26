"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { LEAD_CSV_FIELDS, LEAD_CSV_LABELS } from "@/lib/csv";
import { Button, Modal, Select } from "@/components/ui";
import { useToast } from "@/components/toast";

type Preview = { headers: string[]; mapping: Record<string, string>; preview: Record<string, string>[]; total: number };
type Result = { imported: number; duplicates: number; errors: { row: number; error: string }[] };

/** Two-step CSV import: upload → map columns (auto-guessed) → import. */
export function ImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setMapping({});
    setError("");
  };
  const close = () => {
    reset();
    onClose();
  };

  const post = async (f: File, extra: Record<string, string>, dryRun: boolean) => {
    const form = new FormData();
    form.append("file", f);
    for (const [k, v] of Object.entries(extra)) form.append(k, v);
    const res = await fetch(`/api/import${dryRun ? "?dryRun=1" : ""}`, { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Import failed");
    return json;
  };

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    setFile(f);
    setBusy(true);
    try {
      const p: Preview = await post(f, {}, true);
      setPreview(p);
      setMapping(p.mapping);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const r: Result = await post(file, { mapping: JSON.stringify(mapping) }, false);
      setResult(r);
      toast(`Imported ${r.imported} lead(s)`);
      onImported();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Import leads from CSV" size="lg">
      {!preview && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-6 py-10 text-center transition-colors hover:border-accent hover:bg-panel-2/50">
          <Upload className="size-6 text-muted" />
          <span className="text-sm font-medium">{busy ? "Reading…" : "Choose a CSV file"}</span>
          <span className="text-xs text-muted">The first row should be column headers. You&apos;ll map columns next.</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}

      {preview && !result && (
        <>
          <p className="mb-3 flex items-center gap-2 text-sm text-muted">
            <FileText className="size-4" /> {file?.name} · {preview.total} rows
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {LEAD_CSV_FIELDS.map((field) => (
              <label key={field} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <span className="text-sm">
                  {LEAD_CSV_LABELS[field]}
                  {field === "businessName" && <span className="text-red-500"> *</span>}
                </span>
                <Select
                  className="h-8 w-40 text-xs"
                  value={mapping[field] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                >
                  <option value="">— skip —</option>
                  {preview.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </label>
            ))}
          </div>
          {preview.preview[0] && mapping.businessName && (
            <p className="mt-3 text-xs text-muted">
              First row: <span className="text-fg">{preview.preview[0][mapping.businessName]}</span>
              {mapping.email && <> · {preview.preview[0][mapping.email]}</>}
              {mapping.city && <> · {preview.preview[0][mapping.city]}</>}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">Rows with an email that already exists are skipped. Missing stage defaults to Queued.</p>
        </>
      )}

      {result && (
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">{result.imported}</span> leads imported.</p>
          {result.duplicates > 0 && <p className="text-muted">{result.duplicates} duplicate email(s) skipped.</p>}
          {result.errors.length > 0 && (
            <ul className="max-h-40 overflow-y-auto text-xs text-red-500">
              {result.errors.map((e) => <li key={e.row}>Row {e.row}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        {result ? (
          <Button variant="primary" onClick={close}>Done</Button>
        ) : (
          <>
            {preview && <Button onClick={reset}>Choose another file</Button>}
            <Button variant="primary" disabled={!preview || !mapping.businessName || busy} onClick={runImport}>
              {busy && preview ? "Importing…" : `Import ${preview?.total ?? ""} rows`}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
