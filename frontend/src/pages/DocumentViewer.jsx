import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Search, ShieldCheck, Gauge, FileText,
  RefreshCw, Loader2, AlertCircle, Clock,
} from "lucide-react";
import { Card, Button, Skeleton } from "../components/ui/primitives";
import StatusBadge from "../components/ui/StatusBadge";
import LanguageSelect from "../components/ui/LanguageSelect";
import CompareView from "../components/viewer/CompareView";
import FactsPanel from "../components/viewer/FactsPanel";
import VerificationPanel from "../components/viewer/VerificationPanel";
import ReadabilityPanel from "../components/viewer/ReadabilityPanel";
import ReportPanel from "../components/viewer/ReportPanel";
import DocumentQaPanel from "../components/viewer/DocumentQaPanel";
import { documentsApi } from "../api/documents";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/helpers";

const TABS = [
  { key: "simplified", label: "Simplified text", icon: Sparkles },
  { key: "facts", label: "Important facts", icon: Search },
  { key: "verification", label: "Verification", icon: ShieldCheck },
  { key: "readability", label: "Readability", icon: Gauge },
  { key: "report", label: "Report", icon: FileText },
];

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, meta } = useAuth();
  const { notify } = useToast();

  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("simplified");
  const [language, setLanguage] = useState("English");
  const [reprocessing, setReprocessing] = useState(false);
  const pollRef = useRef(null);

  const load = (showLoading = true) => {
    if (showLoading) setDoc(null);
    return documentsApi
      .get(id)
      .then((d) => {
        setDoc(d);
        setError(null);
        return d;
      })
      .catch((err) => {
        setError(err.friendlyMessage || "This document could not be loaded.");
        return null;
      });
  };

  useEffect(() => {
    load();
    return () => pollRef.current && clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep the language selector in sync with the document / user preference.
  useEffect(() => {
    if (doc?.target_language) setLanguage(doc.target_language);
    else if (user?.preferred_language) setLanguage(user.preferred_language);
  }, [doc?.target_language, user?.preferred_language]);

  // Poll while the backend is still processing.
  useEffect(() => {
    if (doc && (doc.status === "processing" || doc.status === "extracting")) {
      pollRef.current = setInterval(() => load(false), 2500);
      return () => clearInterval(pollRef.current);
    }
  }, [doc?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const runProcess = async (lang) => {
    setReprocessing(true);
    try {
      await documentsApi.process(id, lang);
      await load(false);
      notify("Analysis complete.", "success");
    } catch (err) {
      notify(err.friendlyMessage || "Analysis could not be completed.", "error");
      await load(false);
    } finally {
      setReprocessing(false);
    }
  };

  // ---- Loading & error ----
  if (error) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={28} aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-ink">Document not available</h1>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => load()}>Try again</Button>
            <Button to="/documents">Back to documents</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const busy = doc.status === "processing" || doc.status === "extracting" || reprocessing;
  const isDone = doc.status === "verified" || doc.status === "warning";
  const needsProcessing = doc.status === "pending";
  const failed = doc.status === "failed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/documents" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-700">
          <ArrowLeft size={16} aria-hidden="true" /> Back to documents
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{doc.title}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {doc.source_type === "pdf" ? "PDF document" : "Pasted text"} · {formatDate(doc.created_at)}
              {doc.original_filename ? ` · ${doc.original_filename}` : ""}
            </p>
          </div>

          {/* Language + (re)process */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-52">
              <LanguageSelect value={language} onChange={setLanguage} languages={meta?.languages} />
            </div>
            <Button onClick={() => runProcess(language)} disabled={busy} className="shrink-0">
              {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}
              {isDone ? "Re-simplify" : "Simplify & verify"}
            </Button>
          </div>
        </div>
        {doc.status_message && (failed || doc.status === "warning") && (
          <p className={`mt-3 rounded-xl border p-3 text-sm ${
            failed ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"
          }`}>
            {doc.status_message}
          </p>
        )}
      </div>

      <DocumentQaPanel documentId={id} />

      {/* Processing / pending / failed states */}
      {busy ? (
        <Card className="p-10 text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-brand-700" aria-hidden="true" />
          <p className="mt-4 font-semibold text-ink">Analysing this document…</p>
          <p className="mt-1 text-sm text-ink-muted">
            Simplifying the text, extracting facts, verifying consistency and measuring readability.
          </p>
        </Card>
      ) : needsProcessing ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Clock size={28} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Ready to analyse</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The text has been extracted. Choose a language above and run the analysis to simplify and verify it.
          </p>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="overflow-x-auto">
            <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1" role="tablist">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                      active ? "bg-brand-700 text-white" : "text-ink-soft hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab panels */}
          <div role="tabpanel">
            {tab === "simplified" && <CompareView document={doc} />}
            {tab === "facts" && <FactsPanel facts={doc.facts} />}
            {tab === "verification" && (
              <VerificationPanel verifications={doc.verifications} summary={doc.verification_summary} />
            )}
            {tab === "readability" && (
              <ReadabilityPanel readability={doc.readability} language={doc.target_language} />
            )}
            {tab === "report" && <ReportPanel document={doc} />}
          </div>
        </>
      )}
    </div>
  );
}
