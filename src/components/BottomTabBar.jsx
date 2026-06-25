// src/components/BottomTabBar.jsx
export default function BottomTabBar({ items, activeTab, onChange, badges = {} }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex md:hidden border-t border-subtle bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        const badgeCount = badges[item.id];

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[0.65rem] transition " +
              (active ? "text-accent" : "text-fgMuted")
            }
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {Boolean(badgeCount) && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-semibold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
