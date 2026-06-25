// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import InsightsPage from "./pages/InsightsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import logo from "./assets/logo.png";

import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { defaultCategoryBuckets, resolveBucket } from "./lib/buckets";
import { NAV_ITEMS } from "./lib/nav";
import { DEFAULT_THEME_ID, getTheme, themeToCssVars } from "./lib/themes";
import BottomTabBar from "./components/BottomTabBar.jsx";
import ReviewFlow from "./pages/ReviewFlow.jsx";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

/* -----------------------------
   Blank defaults
------------------------------ */
const blankBudget = { monthLabel: "", income: [], fixed: [], variable: [] };
const blankGoals = [];
const blankAccounts = [];
const blankSettings = {
  estimatedIncomeMonthly: 0,
  theme: DEFAULT_THEME_ID,
  targets: { needs: 50, wants: 30, savings: 20 },
};

/* -----------------------------
   Helpers
------------------------------ */
function getBudgetTotals(budget) {
  const sum = (arr) =>
    (arr || []).reduce((s, item) => s + (Number(item.amount) || 0), 0);

  const totalIncome = sum(budget.income);
  const totalFixed = sum(budget.fixed);
  const totalVariable = sum(budget.variable);
  const remainingForGoals = totalIncome - totalFixed - totalVariable;

  return { totalIncome, totalFixed, totalVariable, remainingForGoals };
}

function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;

  // "YYYY-MM-DD" or "YYYY-MM"
  if (/^\d{4}-\d{2}/.test(dateStr)) return dateStr.slice(0, 7);

  // "MM/DD/YYYY" or "MM-DD-YY"
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

function genId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/* -----------------------------
   App
------------------------------ */
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [reviewOpen, setReviewOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [imports, setImports] = useState([]);

  const [goals, setGoals] = useState(blankGoals);
  const [budget, setBudget] = useState(blankBudget);

  const [accounts, setAccounts] = useState(blankAccounts);
  const [categoryBuckets, setCategoryBuckets] = useState(defaultCategoryBuckets());
  const [settings, setSettings] = useState(blankSettings);

  const [selectedMonth, setSelectedMonth] = useState("all");

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [lastSavedAt, setLastSavedAt] = useState(null); // Date | null

  const saveTimerRef = useRef(null);
  const initialLoadRef = useRef(false);

  const budgetTotals = useMemo(() => getBudgetTotals(budget), [budget]);

  /* -----------------------------
     Goals helpers
  ------------------------------ */
  const handleAddGoal = () => {
    setGoals((prev) => [
      ...prev,
      { id: genId(), label: "New goal", code: `G${prev.length + 1}`, planPerMonth: 0, current: 0, target: 0 },
    ]);
  };

  const handleUpdateGoal = (id, changes) => {
    setGoals((prev) => prev.map((g) => (String(g.id) === String(id) ? { ...g, ...changes } : g)));
  };

  const handleDeleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => String(g.id) !== String(id)));
  };

  // allow +/- contributions; clamp at 0
  const handleContributeGoal = (id, amount) => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt === 0) return;

    setGoals((prev) =>
      prev.map((g) => {
        if (String(g.id) !== String(id)) return g;
        const next = (Number(g.current) || 0) + amt;
        return { ...g, current: Math.max(0, next) };
      })
    );
  };

  /* -----------------------------
     Accounts helpers (manual entry for now; SimpleFin sync lands later
     and writes into this same array with source: "simplefin")
  ------------------------------ */
  const handleAddAccount = (account) => {
    setAccounts((prev) => [
      ...prev,
      {
        id: genId(),
        name: "New account",
        type: "checking",
        balance: 0,
        source: "manual",
        externalAccountId: null,
        ...account,
      },
    ]);
  };

  const handleUpdateAccount = (id, changes) => {
    setAccounts((prev) =>
      prev.map((a) => (String(a.id) === String(id) ? { ...a, ...changes } : a))
    );
  };

  const handleDeleteAccount = (id) => {
    setAccounts((prev) => prev.filter((a) => String(a.id) !== String(id)));
  };

  /* -----------------------------
     Settings + category bucket helpers
  ------------------------------ */
  const handleUpdateSettings = (changes) => {
    setSettings((prev) => ({ ...prev, ...changes }));
  };

  const handleUpdateCategoryBucket = (category, bucket) => {
    setCategoryBuckets((prev) => ({ ...prev, [category]: bucket }));
  };

  /* -----------------------------
     Savings auto-apply
  ------------------------------ */
  const SAVINGS_CATEGORY = "To Savings";
  const SAVINGS_GOAL_LABEL = "Savings";
  const SAVINGS_GOAL_CODE = "SV";

  const applyToSavingsGoal = (delta, forcedGoalId) => {
    const d = Number(delta) || 0;
    if (!Number.isFinite(d) || d === 0) return;

    setGoals((prev) => {
      const idx = prev.findIndex(
        (g) =>
          String(g.id) === String(forcedGoalId) ||
          String(g.code || "").toUpperCase() === SAVINGS_GOAL_CODE ||
          String(g.label || "").toLowerCase() === SAVINGS_GOAL_LABEL.toLowerCase()
      );

      if (idx === -1) {
        const id = forcedGoalId ?? genId();
        return [
          ...prev,
          { id, label: SAVINGS_GOAL_LABEL, code: SAVINGS_GOAL_CODE, planPerMonth: 0, current: Math.max(0, d), target: 0 },
        ];
      }

      const g = prev[idx];
      const nextCurrent = Math.max(0, (Number(g.current) || 0) + d);
      const updated = { ...g, current: nextCurrent };
      return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
    });
  };

  /* -----------------------------
     Transaction handlers
  ------------------------------ */
  const handleAddTransactions = (newItems, batchMeta) => {
    const items = Array.isArray(newItems) ? newItems : [];
    const batchId = batchMeta?.id ?? null;

    setTransactions((prev) => {
      const used = new Set(prev.map((t) => String(t.id)));

      const processed = items.map((tx, idx) => {
        let id = tx?.id;
        if (id === undefined || id === null || id === "") id = `${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
        id = String(id);

        while (used.has(id)) id = `${id}-${Math.floor(Math.random() * 1000)}`;
        used.add(id);

        const category = (tx?.category || "").trim();

        // Savings auto-apply on import/add
        if (category === SAVINGS_CATEGORY) {
          const delta = Number(tx.amount) || 0;
          if (Number.isFinite(delta) && delta !== 0) {
            const goalId = tx?.goalApplied?.goalId ?? genId();
            applyToSavingsGoal(delta, goalId);

            return {
              ...tx,
              id,
              importId: batchId ?? tx.importId ?? null,
              goalApplied: { goalId, delta },
            };
          }
        }

        return { ...tx, id, importId: batchId ?? tx.importId ?? null };
      });

      return [...prev, ...processed];
    });

    if (batchMeta?.id) {
      setImports((prev) => [batchMeta, ...prev]);
    }
  };

  const handleUpdateTransaction = (updatedTx) => {
    setTransactions((prev) => {
      const id = String(updatedTx?.id ?? "");
      const existing = prev.find((t) => String(t.id) === id);

      // undo previous delta (if any)
      if (existing?.goalApplied) {
        applyToSavingsGoal(-Number(existing.goalApplied.delta || 0), existing.goalApplied.goalId);
      }

      const category = (updatedTx?.category || "").trim();
      const nextTx = { ...updatedTx, id };

      // apply new delta (if any)
      if (category === SAVINGS_CATEGORY) {
        const delta = Number(updatedTx.amount) || 0;
        if (Number.isFinite(delta) && delta !== 0) {
          const goalId = existing?.goalApplied?.goalId ?? updatedTx?.goalApplied?.goalId ?? genId();
          applyToSavingsGoal(delta, goalId);
          nextTx.goalApplied = { goalId, delta };
        } else {
          delete nextTx.goalApplied;
        }
      } else {
        delete nextTx.goalApplied;
      }

      return prev.map((t) => (String(t.id) === id ? nextTx : t));
    });
  };

  const handleDeleteTransaction = (id) => {
    setTransactions((prev) => {
      const existing = prev.find((t) => String(t.id) === String(id));
      if (existing?.goalApplied) {
        applyToSavingsGoal(-Number(existing.goalApplied.delta || 0), existing.goalApplied.goalId);
      }
      return prev.filter((t) => String(t.id) !== String(id));
    });
  };

  const handleClearTransactions = () => {
    setTransactions((prev) => {
      prev.forEach((tx) => {
        if (tx?.goalApplied) {
          applyToSavingsGoal(-Number(tx.goalApplied.delta || 0), tx.goalApplied.goalId);
        }
      });
      return [];
    });
    setImports([]);
  };

  const handleDeleteImportBatch = (importId) => {
    setTransactions((prev) => {
      prev.forEach((tx) => {
        if (tx?.importId === importId && tx?.goalApplied) {
          applyToSavingsGoal(-Number(tx.goalApplied.delta || 0), tx.goalApplied.goalId);
        }
      });
      return prev.filter((tx) => tx?.importId !== importId);
    });
    setImports((prev) => prev.filter((b) => b.id !== importId));
  };

  /* -----------------------------
     Auth + Load
  ------------------------------ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);

      if (!u) {
        setTransactions([]);
        setBudget(blankBudget);
        setGoals(blankGoals);
        setImports([]);
        setAccounts(blankAccounts);
        setCategoryBuckets(defaultCategoryBuckets());
        setSettings(blankSettings);
        setSelectedMonth("all");
        setDataLoaded(false);
        setLastSavedAt(null);
        initialLoadRef.current = false;
        return;
      }

      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
          setBudget(data.budget || blankBudget);
          setGoals(Array.isArray(data.goals) ? data.goals : blankGoals);
          setImports(Array.isArray(data.imports) ? data.imports : []);
          setAccounts(Array.isArray(data.accounts) ? data.accounts : blankAccounts);
          setCategoryBuckets(
            data.categoryBuckets && typeof data.categoryBuckets === "object"
              ? { ...defaultCategoryBuckets(), ...data.categoryBuckets }
              : defaultCategoryBuckets()
          );
          setSettings({ ...blankSettings, ...(data.settings || {}) });
          setSelectedMonth(data.selectedMonth || "all");

          if (data.updatedAt) setLastSavedAt(new Date(data.updatedAt));
        } else {
          await setDoc(ref, {
            transactions: [],
            budget: blankBudget,
            goals: blankGoals,
            imports: [],
            accounts: blankAccounts,
            categoryBuckets: defaultCategoryBuckets(),
            settings: blankSettings,
            selectedMonth: "all",
            updatedAt: Date.now(),
          });

          setTransactions([]);
          setBudget(blankBudget);
          setGoals(blankGoals);
          setImports([]);
          setAccounts(blankAccounts);
          setCategoryBuckets(defaultCategoryBuckets());
          setSettings(blankSettings);
          setSelectedMonth("all");
          setLastSavedAt(null);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setDataLoaded(true);
        initialLoadRef.current = true;
      }
    });

    return () => unsub();
  }, []);

  /* -----------------------------
     Save (debounced)
  ------------------------------ */
  useEffect(() => {
    if (!user || !initialLoadRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");

        const ref = doc(db, "users", user.uid);
        await setDoc(
          ref,
          {
            transactions,
            budget,
            goals,
            imports,
            accounts,
            categoryBuckets,
            settings,
            selectedMonth,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        setLastSavedAt(new Date());
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } catch (err) {
        console.error("Error saving to cloud:", err);
        setSaveStatus("error");
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [user, transactions, budget, goals, imports, accounts, categoryBuckets, settings, selectedMonth]);

  /* -----------------------------
     Month filtering + summary
  ------------------------------ */
  const filteredTransactions =
    selectedMonth === "all"
      ? transactions
      : transactions.filter((t) => getMonthKeyFromDate(t.date) === selectedMonth);

  const income = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const expenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const creditCard = filteredTransactions
    .filter((t) => t.type === "credit_card")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const transfers = filteredTransactions
    .filter((t) => t.type === "transfer")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Dashboard leftover (credit card reduces leftover)
  const leftover = income - expenses - creditCard;

  const monthSummary = {
    monthLabel: formatMonthLabel(selectedMonth),
    income,
    expenses,
    creditCard,
    leftover,
    transfers,
  };

  /* -----------------------------
     Theme + Styles
  ------------------------------ */
  const activeTheme = getTheme(settings.theme);
  const themeVarStyle = themeToCssVars(activeTheme.vars);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setStyle({ style: activeTheme.mode === "dark" ? Style.Dark : Style.Light });
  }, [activeTheme.mode]);

  const appClass = "min-h-screen bg-app text-fg";
  const headerClass =
    "border-b sticky top-0 z-50 backdrop-blur bg-app/90 border-subtle h-16";

  const navActive =
    "px-4 py-1 rounded-full border border-accent bg-accent/10 text-accent " +
    "transition transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/50";

  const navInactive =
    "px-4 py-1 rounded-full border border-subtle text-fgMuted " +
    "transition transform hover:-translate-y-0.5 hover:border-accent hover:text-accent " +
    "hover:shadow-md hover:shadow-accent/30";

  const cardClass =
    "rounded-3xl p-6 border bg-surface border-subtle shadow-[0_0_40px_rgba(0,0,0,0.35)] " +
    "transition-transform transition-shadow duration-200 " +
    "hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/40";


  /* -----------------------------
     Loading / Auth gates
  ------------------------------ */
  if (!authReady) {
    return (
      <div className={appClass} style={themeVarStyle}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-fgMuted">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={appClass} style={themeVarStyle}>
        <header className={headerClass}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center">
              <img src={logo} alt="BudgetR" className="h-9 w-auto" />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">
          <LoginPage cardClass={cardClass} />
        </main>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className={appClass} style={themeVarStyle}>
        <header className={headerClass}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BudgetR logo" className="h-9 w-auto" />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-fgMuted">Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------
     Render
  ------------------------------ */
  const needsReviewCount = transactions.filter(
    (t) => resolveBucket(t, categoryBuckets) === null
  ).length;

  return (
    <div className={appClass} style={themeVarStyle}>
      <header className={headerClass}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Left: Logo + Last saved */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="BudgetR logo" className="h-9 w-auto" />
            <div className="leading-tight">
              <div className="text-xs text-fgMuted">
                {saveStatus === "saving"
                  ? "Saving…"
                  : lastSavedAt
                  ? `Last saved at ${lastSavedAt.toLocaleTimeString()}`
                  : "Not saved yet"}
              </div>
            </div>
          </div>

          {/* Right: Tabs (desktop only — mobile uses the bottom tab bar) */}
          <nav className="hidden md:flex gap-2 text-sm">
            {NAV_ITEMS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={activeTab === t.id ? navActive : navInactive}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main
        className="max-w-6xl mx-auto px-6 py-10"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {activeTab === "home" && (
          <HomePage
            cardClass={cardClass}
            monthSummary={monthSummary}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            budgetTotals={budgetTotals}
            settings={settings}
            categoryBuckets={categoryBuckets}
            transactions={transactions}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {activeTab === "activity" && (
          <TransactionsPage
            cardClass={cardClass}
            transactions={transactions}
            imports={imports}
            categoryBuckets={categoryBuckets}
            onDeleteImportBatch={handleDeleteImportBatch}
            onAddTransactions={handleAddTransactions}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onClearTransactions={handleClearTransactions}
            onOpenReview={() => setReviewOpen(true)}
          />
        )}

        {activeTab === "insights" && (
          <InsightsPage
            cardClass={cardClass}
            transactions={filteredTransactions}
            budget={budget}
            setBudget={setBudget}
            budgetTotals={budgetTotals}
            monthSummary={monthSummary}
          />
        )}

        {activeTab === "profile" && (
          <ProfilePage
            cardClass={cardClass}
            user={user}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onContributeGoal={handleContributeGoal}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            categoryBuckets={categoryBuckets}
            onUpdateCategoryBucket={handleUpdateCategoryBucket}
          />
        )}
      </main>

      <BottomTabBar
        items={NAV_ITEMS}
        activeTab={activeTab}
        onChange={setActiveTab}
        badges={{ activity: needsReviewCount }}
      />

      {reviewOpen && (
        <ReviewFlow
          transactions={transactions}
          categoryBuckets={categoryBuckets}
          onUpdateTransaction={handleUpdateTransaction}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}