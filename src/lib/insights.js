// src/lib/insights.js
import { resolveBucket } from "./buckets";

// Category -> total spent, for expense + credit_card transactions.
export function computeCategoryTotals(transactions) {
  const expenseTx = (transactions || []).filter(
    (t) => t.type === "expense" || t.type === "credit_card"
  );

  const totalsByCategory = new Map();
  for (const tx of expenseTx) {
    const cat = tx.category || "Uncategorized";
    const current = totalsByCategory.get(cat) || 0;
    totalsByCategory.set(cat, current + (Number(tx.amount) || 0));
  }

  const totalSpent = Array.from(totalsByCategory.values()).reduce(
    (sum, v) => sum + v,
    0
  );

  const baseData = Array.from(totalsByCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return { baseData, totalSpent };
}

// Bucket ("needs"|"wants"|"savings") -> total spent.
export function computeBucketTotals(transactions, categoryBuckets) {
  const totals = { needs: 0, wants: 0, savings: 0 };

  (transactions || [])
    .filter((t) => t.type === "expense" || t.type === "credit_card")
    .forEach((t) => {
      const bucket = resolveBucket(t, categoryBuckets);
      if (bucket && totals[bucket] !== undefined) {
        totals[bucket] += Number(t.amount) || 0;
      }
    });

  return totals;
}

// Average income / fixed-ish spend / savings over the last N distinct months present in transactions.
export function computeMonthlyAverages(transactions, monthsCount = 3) {
  const getMonthKey = (dateStr) => {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}/.test(dateStr)) return dateStr.slice(0, 7);
    const m = String(dateStr).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (!m) return null;
    let [, mm, , yy] = m;
    mm = mm.padStart(2, "0");
    const year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm}`;
  };

  const monthKeys = Array.from(
    new Set((transactions || []).map((t) => getMonthKey(t.date)).filter(Boolean))
  )
    .sort()
    .slice(-monthsCount);

  if (monthKeys.length === 0) {
    return { income: 0, fixedSpend: 0, savings: 0 };
  }

  let income = 0;
  let fixedSpend = 0;
  let savings = 0;

  (transactions || []).forEach((t) => {
    const key = getMonthKey(t.date);
    if (!monthKeys.includes(key)) return;
    const amt = Number(t.amount) || 0;

    if (t.type === "income") income += amt;
    if (t.type === "expense" || t.type === "credit_card") fixedSpend += amt;
    if ((t.category || "") === "To Savings") savings += amt;
  });

  const n = monthKeys.length;
  return { income: income / n, fixedSpend: fixedSpend / n, savings: savings / n };
}

// "Safe to spend" for the selected month — simplest viable v1 formula.
export function computeSafeToSpend(monthSummary, settings, budgetTotals) {
  const estimatedIncome = Number(settings?.estimatedIncomeMonthly) || 0;
  const totalFixed = Number(budgetTotals?.totalFixed) || 0;
  const expenses = Number(monthSummary?.expenses) || 0;
  return estimatedIncome - totalFixed - expenses;
}

// Match a category name against a budget line item label (case-insensitive).
export function matchBudgetLineItem(category, budget) {
  if (!category) return null;
  const target = String(category).trim().toLowerCase();
  const allItems = [...(budget?.fixed || []), ...(budget?.variable || [])];
  return (
    allItems.find((item) => String(item.label || "").trim().toLowerCase() === target) ||
    null
  );
}
