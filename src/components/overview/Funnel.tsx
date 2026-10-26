import { pct } from "@/lib/utils";

/** Horizontal funnel bars: each stage's width is relative to the top of the funnel. */
export function Funnel({ data }: { data: { stage: string; count: number }[] }) {
  const top = Math.max(1, data[0]?.count ?? 1);
  return (
    <ol className="space-y-2.5">
      {data.map((d, i) => {
        const prev = i > 0 ? data[i - 1].count : null;
        const width = Math.max(2, (d.count / top) * 100);
        return (
          <li key={d.stage} className="group" title={`${d.stage}: ${d.count} leads (${pct(d.count, top)}% of all leads)`}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-muted group-hover:text-fg">{d.stage}</span>
              <span className="tabular-nums">
                <span className="font-medium">{d.count}</span>
                {prev !== null && <span className="ml-2 text-muted">{pct(d.count, prev)}%</span>}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-panel-2">
              <div
                className="h-full rounded-full transition-[filter] group-hover:brightness-125"
                style={{ width: `${width}%`, background: "var(--series-1)", opacity: 1 - i * 0.08 }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
