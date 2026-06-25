// src/components/AccountsList.jsx
import { useState } from "react";
import AccountFormModal from "./AccountFormModal.jsx";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function AccountsList({ cardClass, accounts, onAddAccount, onUpdateAccount, onDeleteAccount }) {
  const [editing, setEditing] = useState(null); // null | {} (new) | account (edit)

  return (
    <>
    <section className={cardClass}>
      <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-accent">
        CONNECTED ACCOUNTS
      </h3>

      <div className="space-y-2">
        {(accounts || []).map((acct) => (
          <div
            key={acct.id}
            onClick={() => setEditing(acct)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-subtle px-3 py-2.5 hover:border-accent"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm text-fg">{acct.name}</p>
                <p className="text-[0.65rem] uppercase tracking-wide text-fgSubtle">
                  {acct.source === "simplefin" ? "Synced" : "Manual"} · {String(acct.type).replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm text-fg">{formatCurrency(acct.balance)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAccount(acct.id);
                }}
                className="text-xs text-fgSubtle hover:text-red-400"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {(!accounts || accounts.length === 0) && (
          <p className="text-sm text-fgSubtle">No accounts yet — add one manually below.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setEditing({})}
        className="mt-4 w-full rounded-full border border-dashed border-subtle px-4 py-2.5 text-sm text-fgMuted hover:border-accent hover:text-accent"
      >
        + Add New Account
      </button>
    </section>

    {editing && (
      <AccountFormModal
        account={editing.id ? editing : null}
        onSave={(changes) => {
          if (editing.id) onUpdateAccount(editing.id, changes);
          else onAddAccount(changes);
        }}
        onClose={() => setEditing(null)}
      />
    )}
    </>
  );
}
