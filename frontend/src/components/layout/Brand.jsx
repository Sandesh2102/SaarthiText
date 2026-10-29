import { Link } from "react-router-dom";

// SaarthiText wordmark. "Saarthi" (सारथी) means guide/charioteer — the mark is a
// simple compass/guide glyph, not a generic AI sparkle.
export default function Brand({ to = "/", light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="SaarthiText home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.5l2.2 4.3L12 16.5 9.8 11.8 12 7.5z" fill="currentColor" />
        </svg>
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Saarthi<span className="text-brand-600">Text</span>
      </span>
    </Link>
  );
}
