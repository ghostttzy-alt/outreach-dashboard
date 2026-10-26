"use client";

import { useState } from "react";
import { Button, Modal, api } from "@/components/ui";
import { useToast } from "@/components/toast";
import { EMPTY_LEAD, LeadForm } from "./LeadForm";

export function AddLeadModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_LEAD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/leads", { method: "POST", body: values });
      toast(`Added ${values.businessName}`);
      setValues(EMPTY_LEAD);
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add lead" size="lg">
      <form onSubmit={submit}>
        <LeadForm values={values} onChange={setValues} />
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !values.businessName.trim()}>
            {saving ? "Saving…" : "Add lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
