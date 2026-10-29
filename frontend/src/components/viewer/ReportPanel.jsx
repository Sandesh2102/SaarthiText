import { useState } from "react";
import { FileDown, Printer, FileText, Loader2 } from "lucide-react";
import { documentsApi } from "../../api/documents";
import { useToast } from "../../context/ToastContext";

// Lets the user download the generated PDF report of the full analysis.
export default function ReportPanel({ document }) {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  const ready = document.status === "verified" || document.status === "warning";

  const download = async () => {
    setBusy(true);
    try {
      const blob = await documentsApi.downloadReport(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      const safe = (document.title || "report").replace(/[^\w\-]+/g, "_").slice(0, 60);
      a.download = `SaarthiText_${safe}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      notify(err.friendlyMessage || "Could not generate the report.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <FileText size={24} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-ink">Analysis report</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Download a PDF containing the simplified text, the extracted facts, the factual-consistency
            results and the readability comparison for this document.
          </p>

          {!ready && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              The report becomes available once the document has been fully processed.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={download}
              disabled={!ready || busy}
              className="btn-primary"
            >
              {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <FileDown size={18} aria-hidden="true" />}
              {busy ? "Preparing…" : "Download PDF report"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-secondary"
            >
              <Printer size={18} aria-hidden="true" /> Print this page
            </button>
          </div>

          <p className="mt-4 text-xs text-ink-muted">
            Note: PDF reports render Latin text reliably. For non-English scripts, the on-screen
            simplified text and read-aloud feature give the most faithful result.
          </p>
        </div>
      </div>
    </div>
  );
}
