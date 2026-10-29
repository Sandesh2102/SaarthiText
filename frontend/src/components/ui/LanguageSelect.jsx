import { Languages } from "lucide-react";
import { LANGUAGE_LABELS } from "../../utils/helpers";

// Accessible language selector used across the app.
export default function LanguageSelect({ value, onChange, languages, id = "language", className = "" }) {
  const list = languages && languages.length ? languages : Object.keys(LANGUAGE_LABELS);
  return (
    <div className={`relative ${className}`}>
      <Languages
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pl-10 pr-9 font-medium"
        aria-label="Select language"
      >
        {list.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang] ? `${lang} — ${LANGUAGE_LABELS[lang]}` : lang}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
        width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"
      >
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
