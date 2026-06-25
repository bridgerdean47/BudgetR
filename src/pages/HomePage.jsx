// src/pages/HomePage.jsx
import { useMemo } from "react";
import HeroCard from "../components/HeroCard.jsx";
import MonthlyAverageRow from "../components/MonthlyAverageRow.jsx";
import NeedsWantsSavingsPanel from "../components/NeedsWantsSavingsPanel.jsx";
import RecentTransactionsStrip from "../components/RecentTransactionsStrip.jsx";
import AccountsList from "../components/AccountsList.jsx";
import {
  computeBucketTotals,
  computeMonthlyAverages,
  computeSafeToSpend,
} from "../lib/insights.js";

function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}/.test(dateStr)) return dateStr.slice(0, 7);
  const m = String(dateStr).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return null;
  let [, mm, , yy] = m;
  mm = mm.padStart(2, "0");
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}-${mm}`;
}

function formatMonthLabel(key) {
  if (key === "all") return "All Months";
  const [year, month] = String(key).split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = parseInt(month, 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx > 11) return key;
  return `${names[idx]} ${year}`;
}

export default function HomePage({
  cardClass,
  monthSummary,
  selectedMonth,
  onMonthChange,
  budgetTotals,
  settings,
  categoryBuckets,
  transactions,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}) {
  const monthOptions = useMemo(() => {
    const set = new Set(
      (transactions || []).map((t) => getMonthKeyFromDate(t.date)).filter(Boolean)
    );
    const keys = Array.from(set).sort();
    return ["all", ...keys].map((key) => ({ key, label: formatMonthLabel(key) }));
  }, [transactions]);

  const safeToSpend = useMemo(
    () => computeSafeToSpend(monthSummary, settings, budgetTotals),
    [monthSummary, settings, budgetTotals]
  );

  const averages = useMemo(() => computeMonthlyAverages(transactions, 3), [transactions]);

  const bucketTotals = useMemo(
    () => computeBucketTotals(transactions, categoryBuckets),
    [transactions, categoryBuckets]
  );

  return (
    <div className="space-y-6">
      <HeroCard
        safeToSpend={safeToSpend}
        monthLabel={monthSummary.monthLabel}
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />

      <MonthlyAverageRow cardClass={cardClass} averages={averages} />

      <NeedsWantsSavingsPanel
        cardClass={cardClass}
        bucketTotals={bucketTotals}
        targets={settings.targets}
      />

      <RecentTransactionsStrip
        cardClass={cardClass}
        transactions={transactions}
        categoryBuckets={categoryBuckets}
      />

      <AccountsList
        cardClass={cardClass}
        accounts={accounts}
        onAddAccount={onAddAccount}
        onUpdateAccount={onUpdateAccount}
        onDeleteAccount={onDeleteAccount}
      />
    </div>
  );
}
