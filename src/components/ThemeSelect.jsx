// src/components/ThemeSelect.jsx
import { THEMES } from "../lib/themes";

export default function ThemeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-subtle bg-app px-3 py-1.5 text-xs text-fg outline-none focus:border-accent"
    >
      {THEMES.map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.label}
        </option>
      ))}
    </select>
  );
}
