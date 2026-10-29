import { useState } from "react";
import { FileText, Sparkles, Columns2, AlignLeft, Lightbulb } from "lucide-react";
import ReadAloud from "../ui/ReadAloud";
import { EmptyState } from "../ui/primitives";

// Shows the simplified explanation prominently, with an optional side-by-side
// view of the original source text. Read-aloud is available for accessibility.
export default function CompareView({ document }) {
  const [compare, setCompare] = useState(false);
  const simplification = document.simplification;
  const language = document.target_language || "English";

  if (!simplification) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No simplified version yet"
        description="Run the analysis to generate a simpler, easier-to-read explanation of this document."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Sparkles size={16} className="text-brand-600" aria-hidden="true" />
          Simplified in <span className="font-semibold text-ink">{language}</span>
        </div>
        <button
          type="button"
          onClick={() => setCompare((c) => !c)}
          className="btn-ghost text-sm"
          aria-pressed={compare}
        >
          {compare ? <AlignLeft size={16} aria-hidden="true" /> : <Columns2 size={16} aria-hidden="true" />}
          {compare ? "Hide original" : "Compare with original"}
        </button>
      </div>

      <div className={`grid gap-4 ${compare ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Simplified */}
        <div className="card p-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-ink">Simplified explanation</h3>
            </div>
            <ReadAloud text={simplification.simplified_text} language={language} />
          </div>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft text-indic">
            {simplification.simplified_text}
          </p>
        </div>

        {/* Original */}
        {compare && (
          <div className="card p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FileText size={16} aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-ink">Original text</h3>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">
              {document.original_text}
            </p>
          </div>
        )}
      </div>

      {/* Why it changed */}
      {simplification.explanation && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-brand-700" aria-hidden="true" />
            <h3 className="font-semibold text-ink">What this means for you</h3>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft text-indic">
            {simplification.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
