// src/pages/HistoryPage.jsx
export default function HistoryPage({ cardClass, actionHistory, onRevert }) {
  const formatTs = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-100">History</h2>
        <p className="text-gray-400 text-sm">
          Snapshots are saved before each deletion. Click "Revert" to restore
          transactions, imports, and goals to that moment.
        </p>
      </div>

      <section className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400">
            ACTION HISTORY
          </h3>
          <span className="text-xs text-gray-500">
            In-memory only — resets on page reload
          </span>
        </div>

        {actionHistory.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">
            No history yet. History is recorded when you delete transactions or
            imports.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-red-900/60">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#111111] text-gray-200 border-b border-red-900">
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Transactions at snapshot
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Revert
                  </th>
                </tr>
              </thead>
              <tbody>
                {actionHistory.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-800 hover:bg-[#111111] transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatTs(entry.ts)}
                    </td>
                    <td className="px-4 py-3 text-gray-100">{entry.label}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">
                      {entry.transactions.length}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRevert(entry.id)}
                        className="text-xs px-3 py-1 rounded-full border border-red-700 text-red-300 hover:border-red-400 hover:text-red-200 transition"
                      >
                        Revert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {actionHistory.length > 0 && (
          <p className="text-xs text-gray-600 mt-3">
            Showing {actionHistory.length} of up to 20 most recent snapshots.
            Reverting removes that snapshot and all newer ones.
          </p>
        )}
      </section>
    </div>
  );
}
