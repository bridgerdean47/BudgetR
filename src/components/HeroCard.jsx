// src/components/HeroCard.jsx
import { useState } from "react";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function HeroCard({
  safeToSpend,
  monthLabel,
  monthOptions,
  selectedMonth,
  onMonthChange,
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-heroFrom to-heroTo px-6 py-8 text-center text-white">
      <p className="text-sm uppercase tracking-[0.2em] text-white/80">safe to spend</p>

      <p className="mt-2 text-5xl font-bold">{formatCurrency(safeToSpend)}</p>

      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/90">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-transparent underline outline-none [&>option]:text-black"
        >
          {monthOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          aria-label="How is this calculated?"
          className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-xs"
        >
          i
        </button>
      </div>

      {infoOpen && (
        <div className="relative z-10 mx-auto mt-3 max-w-xs rounded-xl bg-black/70 px-4 py-3 text-left text-xs text-white/90">
          Estimated income for {monthLabel}, minus your planned fixed bills,
          minus what you&apos;ve spent so far this month.
        </div>
      )}
    </section>
  );
}
