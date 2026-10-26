"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select, Textarea, api } from "@/components/ui";
import { useToast } from "@/components/toast";

/** Log an email the lead sent you. Marking it "unsubscribed" moves the lead to Do Not Contact. */
export function LogReplyModal({ open, onClose, onSaved, leadId }: { open: boolean; onClose: () => void; onSaved: () => void; leadId: string }) {
  const toast = useToast();
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sentAt, setSentAt] = useState(local);
  const [status, setStatus] = useState("replied");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/emails", {
        method: "POST",
        body: { leadId, direction: "inbound", type: "reply", subject, body, status, sentAt: new Date(sentAt).toISOString() },
      });
      toast(status === "unsubscribed" ? "Logged unsubscribe. Lead is now Do Not Contact." : "Reply logged");
      setSubject("");
      setBody("");
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log a reply" size="lg">
      <form onSubmit={save} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Received">
            <Input type="datetime-local" value={sentAt} onChange={(e) => setSentAt(e.target.value)} />
          </Field>
          <Field label="Kind">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="replied">Reply</option>
              <option value="unsubscribed">Unsubscribe / asked not to be contacted</option>
            </Select>
          </Field>
        </div>
        <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Re: Quick idea…" /></Field>
        <Field label="Message"><Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-32" /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={busy}>Log reply</Button>
        </div>
      </form>
    </Modal>
  );
}
