import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ShieldCheck } from "lucide-react";
import { EmptyState } from "../ui/primitives";
import { VERIFICATION_META } from "../../utils/helpers";

const STATUS_ICON = {
  VERIFIED: CheckCircle2,
  PARTIALLY_VERIFIED: AlertTriangle,
  CONFLICT: XCircle,
  NOT_FOUND: HelpCircle,
};

function SummaryBar({ summary }) {
  if (!summary || !summary.total) return null;
  const items = [
    { key: "verified", label: "Verified", classes: "bg-emerald-500" },
    { key: "partially_verified", label: "Partial", classes: "bg-amber-500" },
    { key: "conflict", label: "Conflict", classes: "bg-red-500" },
    { key: "not_found", label: "Not found", classes: "bg-slate-400" },
  ];
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-ink-muted">Fact preservation score</p>
            <p className="text-2xl font-extrabold text-ink">{summary.score}%</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {items.map((it) => (
            <span key={it.key} className="inline-flex items-center gap-1.5 text-ink-soft">
              <span className={`h-2.5 w-2.5 rounded-full ${it.classes}`} />
              {summary[it.key]} {it.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {items.map((it) =>
          summary[it.key] > 0 ? (
            <div key={it.key} className={it.classes} style={{ width: `${(summary[it.key] / summary.total) * 100}%` }} />
          ) : null
        )}
      </div>
    </div>
  );
}

export default function VerificationPanel({ verifications, summary }) {
  if (!verifications || verifications.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No verification results yet"
        description="Run the analysis to compare the simplified text against the original facts."
      />
    );
  }
  return (
    <div className="space-y-4">
      <SummaryBar summary={summary} />
      <div className="space-y-3">
        {verifications.map((v) => {
          const meta = VERIFICATION_META[v.status];
          const Icon = STATUS_ICON[v.status];
          return (
            <div key={v.id} className={`rounded-2xl border bg-white p-4 ${meta.classes.split(" ").find((c) => c.startsWith("border"))}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{v.category}</p>
                  <p className="font-semibold text-ink">{v.label}</p>
                </div>
                <span className={`chip border ${meta.classes}`}>
                  <Icon size={14} aria-hidden="true" /> {meta.label}
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-ink-muted">Original</p>
                  <p className="mt-1 text-sm text-ink-soft">{v.original_value || "—"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-ink-muted">Simplified</p>
                  <p className="mt-1 text-sm text-ink-soft text-indic">{v.simplified_value || "—"}</p>
                </div>
              </div>
              {v.explanation && (
                <p className="mt-3 text-sm text-ink-muted">
                  <span className="font-semibold text-ink-soft">Note: </span>{v.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
