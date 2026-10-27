"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

type Venture = { id: string; slug: string; name: string };
type Revenue = {
  id: string;
  amount: number;
  isMonthly: boolean;
  client: string;
  note: string;
  date: string;
  venture: { name: string; slug: string } | null;
};

function fmt(n: number) {
  return n === 0 ? "$0" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function RevenuePage() {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [form, setForm] = useState({ ventureId: "", amount: "", isMonthly: false, client: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/hq/ventures")
      .then((r) => r.json())
      .then((d) => setVentures(d.data ?? []));
    fetch("/api/hq/revenue")
      .then((r) => r.json())
      .then((d) => setRevenues(d.data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ventureId || !form.amount) return;
    setSaving(true);
    const res = await fetch("/api/hq/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const d = await res.json();
    if (d.data) {
      const v = ventures.find((v) => v.id === form.ventureId);
      setRevenues((prev) => [{ ...d.data, venture: v ? { name: v.name, slug: v.slug } : null }, ...prev]);
      setForm({ ventureId: "", amount: "", isMonthly: false, client: "", note: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const totalMrr = revenues.filter((r) => r.isMonthly).reduce((s, r) => s + r.amount, 0);
  const totalAll = revenues.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/hq" className="mb-3 flex items-center gap-1.5 text-xs text-[#8a8a8a] hover:text-white">
          <ArrowLeft className="size-3.5" /> Back to HQ
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
          <div className="text-xs text-[#8a8a8a]">All time</div>
          <div className="mt-1 text-2xl font-bold text-[#3ddc97]">{fmt(totalAll)}</div>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
          <div className="text-xs text-[#8a8a8a]">Monthly recurring</div>
          <div className="mt-1 text-2xl font-bold text-white">{fmt(totalMrr)}/mo</div>
        </div>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
        <h2 className="mb-4 text-sm font-semibold">Add money</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#8a8a8a]">Project</label>
              <select
                required
                value={form.ventureId}
                onChange={(e) => setForm((f) => ({ ...f, ventureId: e.target.value }))}
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2 text-sm text-white focus:border-[#3ddc97] focus:outline-none"
              >
                <option value="">Select project…</option>
                {ventures.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#8a8a8a]">Amount ($)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2 text-sm text-white placeholder:text-[#8a8a8a] focus:border-[#3ddc97] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#8a8a8a]">Client (optional)</label>
              <input
                placeholder="Client name"
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2 text-sm text-white placeholder:text-[#8a8a8a] focus:border-[#3ddc97] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#8a8a8a]">Note (optional)</label>
              <input
                placeholder="e.g. Website setup fee"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2 text-sm text-white placeholder:text-[#8a8a8a] focus:border-[#3ddc97] focus:outline-none"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isMonthly}
              onChange={(e) => setForm((f) => ({ ...f, isMonthly: e.target.checked }))}
              className="accent-[#3ddc97]"
            />
            <span>This is monthly recurring revenue</span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#3ddc97] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saved ? "Saved ✓" : saving ? "Saving…" : "Add revenue"}
          </button>
        </form>
      </div>

      {/* Revenue list */}
      {revenues.length > 0 && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="border-b border-[#1f1f1f] px-5 py-3">
            <h2 className="text-sm font-semibold">All revenue</h2>
          </div>
          <ul className="divide-y divide-[#1f1f1f]">
            {revenues.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm">{r.venture?.name ?? "—"}{r.client ? ` · ${r.client}` : ""}</p>
                  <p className="text-xs text-[#8a8a8a]">
                    {r.note || "—"} · {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {r.isMonthly ? " · monthly" : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#3ddc97]">{fmt(r.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {revenues.length === 0 && (
        <p className="text-center text-sm text-[#8a8a8a]">No revenue logged yet. Add your first above.</p>
      )}
    </div>
  );
}
