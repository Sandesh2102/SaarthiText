import { STATUS_META } from "../../utils/helpers";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`chip ${meta.classes}`}>
      {(status === "processing" || status === "extracting") && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
      )}
      {meta.label}
    </span>
  );
}
