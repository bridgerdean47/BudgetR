// src/pages/ReviewFlow.jsx
import { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { resolveBucket, BUCKET_LABELS } from "../lib/buckets";
import { CATEGORY_OPTIONS } from "../lib/categories";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

const MOODS = [
  { id: "bad", emoji: "🙁" },
  { id: "neutral", emoji: "😐" },
  { id: "good", emoji: "🙂" },
];

const BUCKET_BUTTONS = [
  { key: "wants", offset: { x: 320, y: 0 } },
  { key: "savings", offset: { x: 0, y: 320 } },
  { key: "needs", offset: { x: -320, y: 0 } },
];

function ReviewCard({ tx, onUpdateTransaction }) {
  const [category, setCategory] = useState(tx.category || "Uncategorized");
  const [mood, setMood] = useState(tx.mood || null);

  return (
    <div className="w-full max-w-sm rounded-3xl border border-subtle bg-surface p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-fg">{tx.description || "Untitled"}</p>
          <p className="text-sm text-fgSubtle">{tx.date}</p>
        </div>
        <p className="shrink-0 text-2xl font-bold text-fg">{formatCurrency(tx.amount)}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMood(m.id);
                onUpdateTransaction({ ...tx, mood: m.id });
              }}
              className={
                "flex h-9 w-9 items-center justify-center rounded-full border text-lg transition " +
                (mood === m.id ? "border-accent bg-accent/20" : "border-subtle")
              }
            >
              {m.emoji}
            </button>
          ))}
        </div>

        <select
          value={category}
          onChange={(e) => {
            const next = e.target.value;
            setCategory(next);
            onUpdateTransaction({ ...tx, category: next });
          }}
          className="rounded-full border border-subtle bg-app px-3 py-1.5 text-xs uppercase tracking-wide text-fg"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function ReviewFlow({ transactions, categoryBuckets, onUpdateTransaction, onClose }) {
  const [queue] = useState(() =>
    (transactions || []).filter((t) => resolveBucket(t, categoryBuckets) === null)
  );
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [exitOffset, setExitOffset] = useState({ x: 0, y: -40 });

  const current = queue[index] ?? null;
  const liveTx = current
    ? (transactions || []).find((t) => String(t.id) === String(current.id)) || current
    : null;

  const advance = (offset) => {
    setExitOffset(offset);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setExitOffset({ x: 0, y: -40 });
    }, 200);
  };

  const handleAssignBucket = (bucketKey, offset) => {
    onUpdateTransaction({ ...liveTx, bucket: bucketKey });
    setHistory((h) => [...h, { txId: liveTx.id, prevBucket: liveTx.bucket ?? null }]);
    advance(offset);
  };

  const handleSkip = () => advance({ x: 0, y: -320 });

  const handleUndo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    const tx = (transactions || []).find((t) => String(t.id) === String(last.txId));
    if (tx) onUpdateTransaction({ ...tx, bucket: last.prevBucket });
    setIndex((i) => Math.max(0, i - 1));
  };

  const handleDragEnd = (_event, info) => {
    if (Math.abs(info.offset.x) > 120) {
      handleSkip();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-app" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex items-center justify-between px-4 py-4">
        <button type="button" onClick={onClose} className="text-fgMuted hover:text-fg" aria-label="Close">
          ←
        </button>
        <div className="text-center">
          <p className="text-lg font-semibold text-fg">Review Transactions</p>
        </div>
        <span className="w-6" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {liveTx ? (
            <Motion.div
              key={liveTx.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: exitOffset.x, y: exitOffset.y, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ReviewCard tx={liveTx} onUpdateTransaction={onUpdateTransaction} />
            </Motion.div>
          ) : (
            <div className="text-center text-fgMuted">
              <p className="text-2xl font-semibold text-fg">All caught up!</p>
              <p className="mt-2 text-sm">No more transactions need review.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-full bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                Done
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {liveTx && (
        <div className="space-y-4 px-6 pb-8" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-center gap-3">
            {BUCKET_BUTTONS.map(({ key, offset }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleAssignBucket(key, offset)}
                className="flex-1 rounded-full border border-subtle py-2.5 text-sm font-medium text-fgMuted hover:border-accent hover:text-accent"
              >
                {BUCKET_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-fgMuted">
            <button type="button" onClick={handleUndo} disabled={!history.length} className="disabled:opacity-30">
              Undo
            </button>
            <span>
              {index + 1} of {queue.length}
            </span>
            <button type="button" onClick={handleSkip}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
