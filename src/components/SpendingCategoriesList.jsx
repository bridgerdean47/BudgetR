// src/components/SpendingCategoriesList.jsx
import { matchBudgetLineItem } from "../lib/insights";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function SpendingCategoriesList({ data, colors, budget }) {
  return (
    <div className="space-y-4">
      {data.map((row, i) => {
        const budgetItem = matchBudgetLineItem(row.name, budget);
        const budgetAmount = Number(budgetItem?.amount) || 0;
        const pct = budgetAmount > 0 ? Math.min(100, Math.round((row.value / budgetAmount) * 100)) : 0;

        return (
          <div key={row.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="truncate text-fg">{row.name}</span>
              </span>
              <span className="shrink-0 text-fgMuted">
                {formatCurrency(row.value)} / {formatCurrency(budgetAmount)}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${budgetAmount > 0 ? pct : 100}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </div>
        );
      })}

      {data.length === 0 && (
        <p className="text-sm text-fgSubtle">No spending yet for this period.</p>
      )}
    </div>
  );
}
