// src/components/TransactionCard.jsx
import { bucketStyle } from "../lib/buckets";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}

function initials(text = "") {
  const cleaned = String(text).trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
}

export default function TransactionCard({ tx, bucket, compact = false, onClick, onDelete }) {
  const style = bucketStyle(bucket);
  const amount = Number(tx.amount) || 0;
  const isIncome = tx.type === "income";

  return (
    <div
      onClick={onClick}
      className={
        "shrink-0 rounded-2xl border px-4 py-3 cursor-pointer transition hover:-translate-y-0.5 " +
        `${style.border} ${style.bg} ` +
        (compact ? "w-40" : "w-full flex items-center justify-between gap-3")
      }
    >
      <div className={compact ? "space-y-2" : "flex items-center gap-3 min-w-0"}>
        <div
          className={
            "flex h-8 w-8 items-center justify-center rounded-full text-[0.65rem] font-semibold shrink-0 " +
            `${style.bg} ${style.text}`
          }
        >
          {initials(tx.description)}
        </div>
        <div className={compact ? "" : "min-w-0"}>
          <p className="truncate text-sm text-fg">{tx.description || "Untitled"}</p>
          <p className="text-xs text-fgSubtle">{formatShortDate(tx.date)}</p>
        </div>
      </div>

      <div className={compact ? "mt-2 flex items-center justify-between" : "text-right shrink-0"}>
        <p className={"text-sm font-semibold " + (isIncome ? "text-green-400" : "text-fg")}>
          {isIncome ? "+" : ""}
          {formatCurrency(amount)}
        </p>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-xs text-fgSubtle hover:text-red-400 ml-2"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
