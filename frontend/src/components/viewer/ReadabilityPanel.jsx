import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EmptyState } from "../ui/primitives";
import { readabilityTone } from "../../utils/helpers";

function Meter({ label, data }) {
  // Flesch Reading Ease: 0 (very hard) .. 100 (very easy)
  const pct = Math.max(0, Math.min(100, data.flesch_reading_ease));
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">{label}</p>
        <span className={`chip border ${readabilityTone(data.level)}`}>{data.level}</span>
      </div>
      <div className="mt-4">
        <div className="flex items-end justify-between">
          <p className="text-3xl font-extrabold text-ink">{data.flesch_reading_ease}</p>
          <p className="text-sm text-ink-muted">Reading ease</p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gradient-to-r from-red-200 via-amber-200 to-emerald-200">
          <div className="relative h-full">
            <span
              className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-ink shadow"
              style={{ left: `calc(${pct}% - 3px)` }}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
          <span>Difficult</span><span>Easy</span>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-ink-muted">Grade level</dt><dd className="font-semibold text-ink">{data.flesch_kincaid_grade}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">Words</dt><dd className="font-semibold text-ink">{data.word_count}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">Sentences</dt><dd className="font-semibold text-ink">{data.sentence_count}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">Avg sentence</dt><dd className="font-semibold text-ink">{data.avg_sentence_length}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">Avg syll/word</dt><dd className="font-semibold text-ink">{data.avg_word_length}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">Complex words</dt><dd className="font-semibold text-ink">{data.complex_word_count}</dd></div>
      </dl>
    </div>
  );
}

export default function ReadabilityPanel({ readability, language }) {
  if (!readability || readability.length === 0) {
    return (
      <EmptyState
        icon={Gauge}
        title="No readability analysis yet"
        description="Run the analysis to compare the readability of the original and simplified text."
      />
    );
  }
  const original = readability.find((r) => r.target === "original");
  const simplified = readability.find((r) => r.target === "simplified");

  let delta = null;
  if (original && simplified) {
    delta = +(simplified.flesch_reading_ease - original.flesch_reading_ease).toFixed(1);
  }
  const improved = delta !== null && delta > 1;
  const worse = delta !== null && delta < -1;

  const isNonEnglish = language && language.toLowerCase() !== "english";

  return (
    <div className="space-y-4">
      {delta !== null && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${
          improved ? "border-emerald-200 bg-emerald-50" : worse ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="mt-0.5">
            {improved ? <TrendingUp className="text-emerald-600" size={22} /> :
             worse ? <TrendingDown className="text-red-600" size={22} /> :
             <Minus className="text-slate-500" size={22} />}
          </div>
          <div>
            <p className="font-semibold text-ink">
              {improved
                ? `Readability improved by ${delta} points`
                : worse
                ? `Readability decreased by ${Math.abs(delta)} points`
                : "Readability is about the same"}
            </p>
            <p className="text-sm text-ink-muted">
              {improved
                ? "The simplified version is easier to read than the original."
                : worse
                ? "The simplified version scored lower — review it against the original."
                : "The simplification did not substantially change the reading-ease score."}
            </p>
          </div>
        </div>
      )}

      {isNonEnglish && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-ink-muted">
          Note: readability formulas are calibrated for English, so these scores are computed on
          the English rendering of the simplified text for a fair comparison with the original.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {original && <Meter label="Original document" data={original} />}
        {simplified && <Meter label="Simplified version" data={simplified} />}
      </div>
    </div>
  );
}
