// src/pages/TransactionsPage.jsx
import { useState, useMemo, useRef } from "react";
import { parseCsv } from "../lib/csv";
import { CATEGORY_OPTIONS } from "../lib/categories";
import { resolveBucket, BUCKET_LABELS } from "../lib/buckets";
import TransactionCard from "../components/TransactionCard.jsx";

/* -------------------------------------------------
   CATEGORY MEMORY (learn from manual edits)
-------------------------------------------------- */
const CATEGORY_MEMORY_KEY = "BUDGETR_CATEGORY_MEMORY_V1";

function normalizeMerchantKey(desc = "") {
  let d = String(desc || "").toLowerCase().trim();

  // remove common noise
  d = d.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");
  d = d.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "");
  d = d.replace(/\b(ref|id|trace|auth|confirmation)\b[:\s-]*[a-z0-9-]+/g, "");
  d = d.replace(/[#*]/g, " ");
  d = d.replace(/\s+/g, " ").trim();

  // keep it short to avoid unstable keys
  if (d.length > 48) d = d.slice(0, 48).trim();

  return d;
}

function loadCategoryMemory() {
  try {
    const raw = localStorage.getItem(CATEGORY_MEMORY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCategoryMemory(map) {
  try {
    localStorage.setItem(CATEGORY_MEMORY_KEY, JSON.stringify(map || {}));
  } catch {
    // ignore
  }
}

function rememberCategory(description, category) {
  const cat = String(category || "").trim();
  if (!cat || cat === "Uncategorized") return;

  const key = normalizeMerchantKey(description);
  if (!key) return;

  const map = loadCategoryMemory();
  map[key] = cat;
  saveCategoryMemory(map);
}

function lookupRememberedCategory(description) {
  const key = normalizeMerchantKey(description);
  if (!key) return null;
  const map = loadCategoryMemory();
  return map[key] || null;
}

/* -------------------------------------------------
   MERCHANT CATEGORY OVERRIDES
-------------------------------------------------- */
const MERCHANT_CATEGORY_RULES = [
  { match: "apts anderson", category: "Rent" },
  { match: "apts ander", category: "Rent" },
  { match: "ach apts", category: "Rent" },
  { match: "withdrawal ach apts", category: "Rent" },
  { match: "quantum fiber", category: "Bills & Utilities" },
  { match: "dept education", category: "Loans" },
  { match: "chase credit crd", category: "Credit Card Payments" },
];

/* -------------------------------------------------
   CATEGORY GUESSER
-------------------------------------------------- */
function guessCategory(desc = "") {
  const d = desc.toLowerCase();

  // Strong rent overrides first
  if (
    d.includes("apts anderson") ||
    d.includes("apts ander") ||
    d.includes(" apts ") ||
    d.startsWith("apts ") ||
    d.includes("apartment") ||
    d.includes(" rent") ||
    d.startsWith("rent") ||
    d.includes("lease")
  ) {
    return "Rent";
  }

  // Merchant rules
  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (d.includes(rule.match)) return rule.category;
  }

  // Groceries
  if (d.includes("walmart") || d.includes("grocery") || d.includes("winco"))
    return "Groceries";

  // Restaurants / fast food
  if (
    d.includes("mcdonald") ||
    d.includes("taco bell") ||
    d.includes("burger king") ||
    d.includes("wendy") ||
    d.includes("subway") ||
    d.includes("restaurant") ||
    d.includes("cafe")
  )
    return "Food & Drink";

  // Gas
  if (d.includes("shell") || d.includes("chevron") || d.includes("gas "))
    return "Gas";

  // Utilities
  if (
    d.includes("power") ||
    d.includes("electric") ||
    d.includes("water") ||
    d.includes("gas & electric")
  )
    return "Bills & Utilities";

  // Subscriptions / streaming
  if (
    d.includes("spotify") ||
    d.includes("netflix") ||
    d.includes("hulu") ||
    d.includes("youtube")
  )
    return "Entertainment";

  // Loans / debt
  if (d.includes("loan")) return "Loans";

  // Travel
  if (d.includes("flight") || d.includes("hotel") || d.includes("airbnb"))
    return "Travel";

  // Pets
  if (d.includes("pet") || d.includes("vet")) return "Pets";

  // Safe Insurance detection
  if (d.includes("insurance") || /\binsurance\b/.test(d)) return "Insurance";

  // Shopping
  if (d.includes("amazon") || d.includes("target")) return "Shopping";

  return null;
}

/* -------------------------------------------------
   DATE HELPERS
-------------------------------------------------- */
function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}/.test(dateStr)) return dateStr.slice(0, 7);

  const m = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    let [, mm, , yy] = m;
    mm = mm.padStart(2, "0");
    const year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm}`;
  }

  return null;
}

function formatMonthLabel(key) {
  if (key === "all") return "All months";
  const [year, month] = key.split("-");
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const idx = parseInt(month, 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx > 11) return key;
  return `${names[idx]} ${year}`;
}

/* -------------------------------------------------
   COMPONENT
-------------------------------------------------- */
export default function TransactionsPage({
  cardClass,
  transactions,
  imports,
  categoryBuckets,
  onDeleteImportBatch,
  onAddTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onClearTransactions,
  onOpenReview,
}) {
  const [editing, setEditing] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [bucketFilter, setBucketFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);
  const getFileSig = (f) => `${f.name}::${f.size}::${f.lastModified}`;

  const importedSigSet = useMemo(() => {
    const set = new Set();
    (imports || []).forEach((b) => {
      (b.files || []).forEach((f) => {
        if (!f) return;
        set.add(`${f.name}::${f.size}::${f.lastModified}`);
      });
    });
    return set;
  }, [imports]);

  /* -----------------------------------------------
     CSV IMPORT (MULTI-FILE) + BATCH META
  -------------------------------------------------- */
  const readFileText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const bad = files.find((f) => !f.name.toLowerCase().endsWith(".csv"));
    if (bad) {
      setImportMessage("Please choose only .csv files.");
      return;
    }

    const newFiles = files.filter((f) => !importedSigSet.has(getFileSig(f)));
    const dupFiles = files.filter((f) => importedSigSet.has(getFileSig(f)));

    if (!newFiles.length) {
      setImportMessage(
        `Skipped import: all selected CSV(s) were already imported (${dupFiles
          .map((f) => f.name)
          .join(", ")}).`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImportMessage(
      `Reading ${newFiles.length} new file(s)...` +
        (dupFiles.length ? ` (Skipped ${dupFiles.length} duplicate)` : "")
    );

    const allParsed = [];

    for (const file of newFiles) {
      const text = await readFileText(file);
      const parsedRaw = parseCsv(text, transactions.length + allParsed.length);

      const parsed = parsedRaw.map((tx) => {
        const desc = (tx.description || "").toLowerCase();

        // ----- TYPE FIX -----
        // App types are now: income | expense | transfer | credit_card
        // Normalize legacy values to keep old data/imports from breaking,
        // but keep the explicit "credit_card" type (user-selectable)
        let type = tx.type || "expense";
        // Fail-safe: any Payment Thank You should always be a transfer
if (/payment\s*thank\s*you/.test(desc)) {
  type = "transfer";
}

// If Chase/CSV category is Credit Card Payments, treat as transfer (paying card)
if (String(tx.category || "").toLowerCase() === "credit card payments") {
  type = "transfer";
}

        // Normalize legacy values, but keep the explicit "credit_card" type (user-selectable)
        if (type === "payment" || type === "credit") {
          type = "transfer";
        }

        // EPAY and CC-payment-like descriptions should be transfer
        if (
          desc.includes(" epay") ||
          desc.includes("type: epay") ||
          desc.includes("withdrawal ach chase credit crd") ||
          desc.includes("payment thank you")
        ) {
          type = "transfer";
        }

        // ----- CATEGORY LOGIC -----
        // IMPORTANT: if `parseCsv` already provided a category (ex: Chase CSV), keep it.
        let category = tx.category || "";
        const guessed = guessCategory(tx.description);

        // If the CSV didn't provide a real category, try learned memory
        const remembered = lookupRememberedCategory(tx.description);

        if (guessed === "Rent") {
          category = "Rent";
        } else if (!category || category.toLowerCase() === "uncategorized") {
          category = remembered || guessed || "Uncategorized";
        }

        return {
          ...tx,
          type,
          category,
        };
      });

      allParsed.push(...parsed);
    }

    if (!allParsed.length) {
      setImportMessage("No valid rows found in selected CSV files.");
    } else {
      const batchId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const batchMeta = {
        id: batchId,
        importedAt: Date.now(),
        count: allParsed.length,
        files: newFiles.map((f) => ({
          name: f.name,
          size: f.size,
          lastModified: f.lastModified,
        })),
      };

      onAddTransactions(allParsed, batchMeta);
      setImportMessage(
        `Imported ${allParsed.length} transactions from ${files.length} file(s).`
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* -----------------------------------------------
     DRAG/DROP
  -------------------------------------------------- */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  /* -----------------------------------------------
     SORTING + FILTERS
  -------------------------------------------------- */
  const handleSortClick = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const monthOptions = useMemo(() => {
    const set = new Set(
      (transactions || [])
        .map((t) => getMonthKeyFromDate(t.date))
        .filter(Boolean)
    );
    const keys = Array.from(set).sort();
    return ["all", ...keys];
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    let data = [...(transactions || [])];

    // SORT
    if (sortConfig.key === "date") {
      data.sort((a, b) => {
        const da = new Date(a.date || 0);
        const db = new Date(b.date || 0);
        return sortConfig.direction === "asc" ? da - db : db - da;
      });
    } else if (sortConfig.key === "type") {
      const order = { income: 0, expense: 1, transfer: 2, credit_card: 2 };
      data.sort((a, b) => {
        const aRank = order[a.type] ?? 99;
        const bRank = order[b.type] ?? 99;
        return sortConfig.direction === "asc" ? aRank - bRank : bRank - aRank;
      });
    }

    // FILTER (month)
    if (selectedMonth !== "all") {
      data = data.filter((t) => getMonthKeyFromDate(t.date) === selectedMonth);
    }

    // FILTER (category)
    if (categoryFilter !== "all") {
      data = data.filter(
        (t) => (t.category || "Uncategorized") === categoryFilter
      );
    }

    // FILTER (bucket)
    if (bucketFilter !== "all") {
      data = data.filter((t) => resolveBucket(t, categoryBuckets) === bucketFilter);
    }

    // FILTER (search)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter((t) => (t.description || "").toLowerCase().includes(q));
    }

    return data;
  }, [transactions, sortConfig, categoryFilter, selectedMonth, bucketFilter, searchQuery, categoryBuckets]);

  const uncategorizedCount = useMemo(
    () => (transactions || []).filter((t) => resolveBucket(t, categoryBuckets) === null).length,
    [transactions, categoryBuckets]
  );

  const renderSortIcon = (key) =>
    sortConfig.key !== key ? (
      <span className="text-[0.6rem] text-fgSubtle">⇅</span>
    ) : (
      <span className="text-[0.6rem] text-fgMuted">
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );

  /* -----------------------------------------------
     RENDER
  -------------------------------------------------- */
  const bucketChipClass = (id) =>
    "px-3 py-1 rounded-full text-xs border transition " +
    (bucketFilter === id
      ? "border-accent bg-accent/10 text-accent"
      : "border-subtle text-fgMuted hover:border-accent hover:text-accent");

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl font-bold text-fg">Activity</h2>
        <button
          type="button"
          onClick={onClearTransactions}
          className="text-xs px-4 py-1.5 rounded-full border border-subtle text-fgMuted hover:border-red-500 hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      {/* SEARCH + REVIEW */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Transactions"
          className="flex-1 rounded-full border border-subtle bg-app px-4 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={onOpenReview}
          className="relative shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          Review
          {uncategorizedCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-semibold text-white">
              {uncategorizedCount > 99 ? "99+" : uncategorizedCount}
            </span>
          )}
        </button>
      </div>

      {/* BUCKET FILTER CHIPS */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={bucketChipClass("all")} onClick={() => setBucketFilter("all")}>
          All
        </button>
        {["needs", "wants", "savings"].map((key) => (
          <button key={key} type="button" className={bucketChipClass(key)} onClick={() => setBucketFilter(key)}>
            {BUCKET_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Imported CSV history */}
      {Array.isArray(imports) && imports.length > 0 && (
        <section className={cardClass}>
          <h3 className="mb-3 text-xs font-semibold tracking-[0.28em] text-accent">
            IMPORT HISTORY
          </h3>

          <div className="space-y-2 text-sm">
            {imports.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-subtle px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-fg truncate">
                    {(b.files || []).map((f) => f.name).join(", ")}
                  </div>
                  <div className="text-xs text-fgMuted">
                    {new Date(b.importedAt).toLocaleString()} • {b.count}{" "}
                    transactions
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteImportBatch(b.id)}
                  className="shrink-0 text-xs px-3 py-1 rounded-full border border-subtle text-fgMuted hover:border-red-500 hover:text-red-300"
                >
                  Delete import
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* IMPORT CARD */}
      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-accent">
          BANK STATEMENT IMPORT (CSV)
        </h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            "mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 cursor-pointer transition " +
            (isDragging
              ? "border-accent bg-accent/10"
              : "border-accent/40 bg-app/40 hover:border-accent hover:bg-accent/5")
          }
        >
          <p className="text-fg font-medium mb-1">
            Drag & drop CSV file(s) here
          </p>
          <p className="text-fgMuted">
            or <span className="text-accent underline">click to browse</span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>

        {importMessage && (
          <p className="text-[0.7rem] text-fgMuted mt-2">{importMessage}</p>
        )}
      </section>

      {/* TRANSACTION LIST */}
      <section className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {/* Month filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-fgMuted">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-app border border-subtle text-xs rounded px-2 py-1 text-fg"
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabel(key)}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-fgMuted">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-app border border-subtle text-xs rounded px-2 py-1 text-fg"
            >
              <option value="all">All</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort by date */}
          <button
            type="button"
            onClick={() => handleSortClick("date")}
            className="flex items-center gap-1 text-xs text-fgMuted hover:text-fg"
          >
            <span>Date</span>
            {renderSortIcon("date")}
          </button>

          {/* Clear */}
          {(categoryFilter !== "all" || selectedMonth !== "all" || bucketFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("all");
                setSelectedMonth("all");
                setBucketFilter("all");
                setSearchQuery("");
              }}
              className="text-xs text-fgMuted hover:text-fg underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="space-y-2">
          {sortedTransactions.map((t, i) => (
            <TransactionCard
              key={`${t.id}-${i}`}
              tx={t}
              bucket={resolveBucket(t, categoryBuckets)}
              onClick={() => setEditing(t)}
              onDelete={() => onDeleteTransaction(t.id)}
            />
          ))}

          {sortedTransactions.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-fgSubtle">
              No transactions yet. Import a CSV to see them here.
            </p>
          )}
        </div>
      </section>

      {/* MODAL EDITOR */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl space-y-4 border border-subtle">
            <h3 className="text-xl font-semibold mb-2 text-fg">
              Edit Transaction
            </h3>

            <div className="space-y-1">
              <label className="text-sm text-fgMuted">Description</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-app text-fg border border-subtle"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-fgMuted">Date</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-app text-fg border border-subtle"
                value={editing.date}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-fgMuted">Type</label>
              <select
                className="w-full p-2 rounded bg-app text-fg border border-subtle"
                value={
                  editing.type === "payment" || editing.type === "credit"
                    ? "transfer"
                    : editing.type
                }
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value })
                }
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-fgMuted">Category</label>
              <select
                className="w-full p-2 rounded bg-app text-fg border border-subtle"
                value={editing.category || "Uncategorized"}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-fgMuted">Amount</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-app text-fg border border-subtle"
                value={editing.amount}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-4 py-2 rounded bg-subtle/50 text-fg hover:bg-subtle"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/90"
                onClick={() => {
                  const normalizedType =
                    editing.type === "payment" || editing.type === "credit"
                      ? "transfer"
                      : editing.type;

                  const toSave = {
                    ...editing,
                    type: normalizedType,
                    category:
                      editing.category ||
                      guessCategory(editing.description) ||
                      "Uncategorized",
                  };
                  rememberCategory(toSave.description, toSave.category);
                  onUpdateTransaction(toSave);
                  setEditing(null);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}