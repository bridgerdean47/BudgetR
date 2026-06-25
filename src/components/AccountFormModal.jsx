// src/components/AccountFormModal.jsx
import { useState } from "react";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "loan", "investment", "cash"];

export default function AccountFormModal({ account, onSave, onClose }) {
  const [name, setName] = useState(account?.name || "");
  const [type, setType] = useState(account?.type || "checking");
  const [balance, setBalance] = useState(account?.balance ?? 0);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), type, balance: Number(balance) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-subtle bg-surface p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-fg">
          {account ? "Edit Account" : "Add Account"}
        </h3>

        <div className="space-y-1">
          <label className="text-sm text-fgMuted">Name</label>
          <input
            className="w-full rounded border border-subtle bg-app p-2 text-fg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chase Checking"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-fgMuted">Type</label>
          <select
            className="w-full rounded border border-subtle bg-app p-2 text-fg"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-fgMuted">Balance</label>
          <input
            type="number"
            className="w-full rounded border border-subtle bg-app p-2 text-fg"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded bg-subtle/50 px-4 py-2 text-fg hover:bg-subtle"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-accent px-4 py-2 text-white hover:bg-accent/90"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
