import { useState } from "react";
import { AlertCircle, Loader2, MessageCircleQuestion, Send } from "lucide-react";
import { Button, Card } from "../ui/primitives";
import { documentsApi } from "../../api/documents";

const MAX_QUESTION_LENGTH = 1000;

export default function DocumentQaPanel({ documentId }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitQuestion = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError("Enter a question.");
      setResponse(null);
      return;
    }
    if (loading) return;

    setLoading(true);
    setError("");
    setResponse(null);
    try {
      const result = await documentsApi.ask(documentId, trimmedQuestion);
      setResponse(result);
    } catch (requestError) {
      setError(requestError.friendlyMessage || "The question could not be answered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <MessageCircleQuestion size={18} aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-ink">Ask this document</h2>
      </div>

      <form onSubmit={submitQuestion} className="mt-4 space-y-3">
        <label htmlFor="document-question" className="block text-sm font-medium text-ink-soft">
          Question
        </label>
        <textarea
          id="document-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          rows={3}
          className="input min-h-24 w-full resize-y"
          placeholder="Ask a question about this document"
          disabled={loading}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-muted">{question.length}/{MAX_QUESTION_LENGTH}</span>
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={16} aria-hidden="true" />
            )}
            {loading ? "Asking…" : "Ask"}
          </Button>
        </div>
      </form>

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {response && (
        <section
          aria-live="polite"
          className={`mt-4 rounded-xl border p-4 ${
            response.found
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-amber-200 bg-amber-50/70"
          }`}
        >
          <h3 className="text-sm font-semibold text-ink">
            {response.found ? "Answer" : "Not found in document"}
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {response.answer}
          </p>

          {response.references?.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase text-ink-muted">Sources</h4>
              {response.references.map((reference, index) => (
                <details
                  key={`${reference.source}-${reference.page_number ?? "document"}-${index}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <summary className="cursor-pointer text-sm font-medium text-ink-soft">
                    {reference.page_number != null
                      ? `Page ${reference.page_number}`
                      : "Document source"}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                    {reference.excerpt}
                  </p>
                </details>
              ))}
            </div>
          )}
        </section>
      )}
    </Card>
  );
}
