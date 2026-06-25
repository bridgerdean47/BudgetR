// src/pages/ManageCategoriesPage.jsx
import { CATEGORY_OPTIONS } from "../lib/categories";
import { BUCKET_LABELS } from "../lib/buckets";

const OPTIONS = [...Object.keys(BUCKET_LABELS), null];

export default function ManageCategoriesPage({ categoryBuckets, onUpdateCategoryBucket, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-app" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex items-center gap-3 px-4 py-4">
        <button type="button" onClick={onClose} className="text-fgMuted hover:text-fg" aria-label="Close">
          ←
        </button>
        <h2 className="text-lg font-semibold text-fg">Manage Categories</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <p className="mb-4 text-sm text-fgMuted">
          Choose which bucket each category counts toward on Home and Insights.
        </p>

        <div className="space-y-3">
          {CATEGORY_OPTIONS.map((cat) => (
            <div key={cat} className="rounded-2xl border border-subtle px-4 py-3">
              <p className="mb-2 text-sm text-fg">{cat}</p>
              <div className="flex gap-2">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt ?? "none"}
                    type="button"
                    onClick={() => onUpdateCategoryBucket(cat, opt)}
                    className={
                      "flex-1 rounded-full border px-2 py-1.5 text-xs transition " +
                      (categoryBuckets[cat] === opt
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-subtle text-fgMuted hover:border-fgSubtle")
                    }
                  >
                    {opt ? BUCKET_LABELS[opt] : "None"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
