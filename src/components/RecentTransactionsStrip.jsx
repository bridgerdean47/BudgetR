// src/components/RecentTransactionsStrip.jsx
import TransactionCard from "./TransactionCard.jsx";
import { resolveBucket } from "../lib/buckets";

export default function RecentTransactionsStrip({ cardClass, transactions, categoryBuckets, limit = 8 }) {
  const recent = [...(transactions || [])]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, limit);

  return (
    <section className={cardClass}>
      <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-accent">
        RECENT TRANSACTIONS
      </h3>

      {recent.length === 0 ? (
        <p className="text-sm text-fgMuted">No transactions yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
          {recent.map((tx, i) => (
            <div key={`${tx.id}-${i}`} className="snap-start">
              <TransactionCard tx={tx} bucket={resolveBucket(tx, categoryBuckets)} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
