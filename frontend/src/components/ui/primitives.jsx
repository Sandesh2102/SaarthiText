import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function Button({ as = "button", variant = "primary", className = "", children, to, ...props }) {
  const cls = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  }[variant];
  const classes = `${cls} ${className}`;
  if (to) return <Link to={to} className={classes} {...props}>{children}</Link>;
  const Tag = as;
  return <Tag className={classes} {...props}>{children}</Tag>;
}

export function Card({ className = "", children, ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

export function Spinner({ size = 20, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function Badge({ className = "", children }) {
  return <span className={`chip ${className}`}>{children}</span>;
}

export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon size={26} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}
