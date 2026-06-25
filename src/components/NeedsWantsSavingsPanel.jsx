// src/components/NeedsWantsSavingsPanel.jsx
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BUCKET_LABELS } from "../lib/buckets";

const COLORS = { needs: "#3b82f6", wants: "#eab308", savings: "#22c55e" };

function pct(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default function NeedsWantsSavingsPanel({ cardClass, bucketTotals, targets }) {
  const total = bucketTotals.needs + bucketTotals.wants + bucketTotals.savings;

  const data = ["needs", "wants", "savings"]
    .map((key) => ({ key, value: bucketTotals[key] }))
    .filter((row) => row.value > 0);

  return (
    <section className={cardClass}>
      <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-accent">
        SPENDING
      </h3>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="h-28 w-28 shrink-0">
          {data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center rounded-full border border-subtle text-[0.65rem] text-fgSubtle">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="key" innerRadius="60%" outerRadius="100%" paddingAngle={2}>
                  {data.map((row) => (
                    <Cell key={row.key} fill={COLORS[row.key]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="w-full space-y-2.5 text-sm">
          {["needs", "wants", "savings"].map((key) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[key] }} />
                <span className="text-fg">{BUCKET_LABELS[key]}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-fgMuted">
                <span className="font-semibold text-fg">{pct(bucketTotals[key], total)}%</span>
                {" actual · "}
                {targets[key]}% plan
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
