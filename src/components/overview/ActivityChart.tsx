"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { label: string; sent: number; replies: number };

const SERIES = [
  { key: "sent", name: "Emails sent", color: "var(--series-1)" },
  { key: "replies", name: "Replies", color: "var(--series-2)" },
] as const;

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium">{label}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2 text-muted">
          <span className="h-0.5 w-3 rounded" style={{ background: s.color }} />
          {s.name}
          <span className="ml-auto pl-3 font-medium tabular-nums text-fg">{payload.find((p) => p.dataKey === s.key)?.value ?? 0}</span>
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({ data }: { data: Point[] }) {
  const totals = { sent: data.reduce((s, d) => s + d.sent, 0), replies: data.reduce((s, d) => s + d.replies, 0) };
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: s.color }} />
            {s.name} <span className="font-medium tabular-nums text-fg">{totals[s.key]}</span>
          </span>
        ))}
      </div>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--chart-axis)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--chart-axis)", strokeDasharray: "3 3" }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                animationDuration={500}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--panel)" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
