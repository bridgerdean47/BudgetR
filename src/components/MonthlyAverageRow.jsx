// src/components/MonthlyAverageRow.jsx
import OverviewStat from "./OverviewStat.jsx";

export default function MonthlyAverageRow({ cardClass, averages }) {
  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-[0.28em] text-accent">
          MONTHLY AVERAGE
        </h3>
        <p className="text-[0.65rem] text-fgSubtle">based on the past 3 months</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <OverviewStat label="INCOME" value={averages.income} color="text-green-400" />
        <OverviewStat label="FIXED SPEND" value={averages.fixedSpend} color="text-red-500" />
        <OverviewStat label="SAVINGS" value={averages.savings} color="text-emerald-400" />
      </div>
    </section>
  );
}
