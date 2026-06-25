// src/pages/ProfilePage.jsx
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import AccountsList from "../components/AccountsList.jsx";
import ThemeSelect from "../components/ThemeSelect.jsx";
import GoalsPage from "./GoalsPage.jsx";
import ManageCategoriesPage from "./ManageCategoriesPage.jsx";

function initials(text = "") {
  const cleaned = String(text).trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s@.]+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
}

export default function ProfilePage({
  cardClass,
  user,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onContributeGoal,
  settings,
  onUpdateSettings,
  categoryBuckets,
  onUpdateCategoryBucket,
}) {
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  const displayName = user?.displayName || user?.email || "";
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <div className="space-y-6">
        {/* User header */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-xl font-semibold text-accent">
            {initials(displayName)}
          </div>
          <div>
            <p className="text-xl font-semibold text-fg">{user?.displayName || "Account"}</p>
            <p className="text-sm text-fgMuted">{user?.email}</p>
            {memberSince && <p className="text-xs text-fgSubtle">Member since {memberSince}</p>}
          </div>
        </div>

        <AccountsList
          cardClass={cardClass}
          accounts={accounts}
          onAddAccount={onAddAccount}
          onUpdateAccount={onUpdateAccount}
          onDeleteAccount={onDeleteAccount}
        />

        <section className={cardClass}>
          <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-accent">SETTINGS</h3>

          <div className="divide-y divide-subtle">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-fg">Estimated Income</span>
              <div className="flex items-center gap-1 text-sm text-fgMuted">
                <span>$</span>
                <input
                  type="number"
                  value={settings.estimatedIncomeMonthly}
                  onChange={(e) =>
                    onUpdateSettings({ estimatedIncomeMonthly: Number(e.target.value) || 0 })
                  }
                  className="w-24 bg-transparent text-right text-fg outline-none"
                />
                <span className="text-fgSubtle">/ month</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setManageCategoriesOpen(true)}
              className="flex w-full items-center justify-between py-3 text-left"
            >
              <span className="text-sm text-fg">Manage Categories</span>
              <span className="text-fgSubtle">→</span>
            </button>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-fg">Theme</span>
              <ThemeSelect value={settings.theme} onChange={(theme) => onUpdateSettings({ theme })} />
            </div>
          </div>
        </section>

        <GoalsPage
          cardClass={cardClass}
          goals={goals}
          onAddGoal={onAddGoal}
          onUpdateGoal={onUpdateGoal}
          onDeleteGoal={onDeleteGoal}
          onContributeGoal={onContributeGoal}
        />

        <button
          type="button"
          onClick={() => signOut(auth)}
          className="w-full rounded-full border border-subtle py-2.5 text-sm text-fgMuted hover:border-accent hover:text-accent"
        >
          Log out
        </button>
      </div>

      {manageCategoriesOpen && (
        <ManageCategoriesPage
          categoryBuckets={categoryBuckets}
          onUpdateCategoryBucket={onUpdateCategoryBucket}
          onClose={() => setManageCategoriesOpen(false)}
        />
      )}
    </>
  );
}
