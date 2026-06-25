// src/pages/InsightsPage.jsx
import { useMemo, useState } from "react";
import HalfDonutGauge from "../components/HalfDonutGauge.jsx";
import SpendingCategoriesList from "../components/SpendingCategoriesList.jsx";
import BudgetPage from "./BudgetPage.jsx";
import { computeCategoryTotals } from "../lib/insights.js";

const COLORS = [
  "#22c55e",
  "#ef4444",
  "#eab308",
  "#6366f1",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#facc15",
  "#14b8a6",
  "#64748b",
];

const MAX_SEGMENTS = 8;

export default function InsightsPage({
  cardClass,
  transactions,
  budget,
  setBudget,
  budgetTotals,
  monthSummary,
}) {
  const [subTab, setSubTab] = useState("spending"); // "spending" | "estimate"

  const { baseData, totalSpent } = useMemo(
    () => computeCategoryTotals(transactions),
    [transactions]
  );

  const data = useMemo(() => {
    if (baseData.length <= MAX_SEGMENTS) return baseData;
    const top = baseData.slice(0, MAX_SEGMENTS - 1);
    const rest = baseData.slice(MAX_SEGMENTS - 1);
    const otherTotal = rest.reduce((s, r) => s + r.value, 0);
    return [...top, { name: "Other", value: otherTotal }];
  }, [baseData]);

  const totalBudget = (budgetTotals?.totalFixed || 0) + (budgetTotals?.totalVariable || 0);

  const subTabClass = (id) =>
    "px-4 py-1.5 rounded-full text-xs border transition " +
    (subTab === id
      ? "border-accent bg-accent/10 text-accent"
      : "border-subtle text-fgMuted hover:border-accent hover:text-accent");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button type="button" className={subTabClass("spending")} onClick={() => setSubTab("spending")}>
          Spending
        </button>
        <button type="button" className={subTabClass("estimate")} onClick={() => setSubTab("estimate")}>
          Estimate
        </button>
      </div>

      {subTab === "spending" ? (
        <section className={cardClass}>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.28em] text-accent">
            SPENDING BY CATEGORY
          </h3>

          <HalfDonutGauge data={data} colors={COLORS} totalSpent={totalSpent} totalBudget={totalBudget} />

          <div className="mt-4">
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-fgSubtle">
              SPENDING CATEGORIES
            </p>
            <SpendingCategoriesList data={data} colors={COLORS} budget={budget} />
          </div>
        </section>
      ) : (
        <BudgetPage
          cardClass={cardClass}
          monthSummary={monthSummary}
          budget={budget}
          setBudget={setBudget}
          budgetTotals={budgetTotals}
        />
      )}
    </div>
  );
}
