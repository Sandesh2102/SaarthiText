import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Type, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button, Card, Field } from "../components/ui/primitives";
import LanguageSelect from "../components/ui/LanguageSelect";
import LlmWarning from "../components/ui/LlmWarning";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { documentsApi } from "../api/documents";

const STAGES = [
  "Uploading document…",
  "Extracting text…",
  "Analysing content…",
  "Simplifying & verifying facts…",
  "Calculating readability…",
];

export default function Upload() {
  const { user, meta } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [mode, setMode] = useState("pdf"); // pdf | text
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState(user?.preferred_language || "English");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);

  const maxMb = meta?.max_upload_mb || 10;

  const pickFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      notify("Only PDF files are supported.", "error");
      return;
    }
    if (f.size > maxMb * 1024 * 1024) {
      notify(`File is too large. Maximum size is ${maxMb} MB.`, "error");
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const runStages = () => {
    setStage(0);
    const timers = [];
    for (let i = 1; i < STAGES.length; i++) {
      timers.push(setTimeout(() => setStage(i), i * 1200));
    }
    return () => timers.forEach(clearTimeout);
  };

  const submit = async () => {
    if (mode === "pdf" && !file) return notify("Please choose a PDF to upload.", "error");
    if (mode === "text" && text.trim().length < 20)
      return notify("Please paste at least a few sentences.", "error");
    if (mode === "text" && !title.trim()) return notify("Please add a title.", "error");

    setBusy(true);
    const stopStages = runStages();
    try {
      // 1. Ingest (create document + extract text)
      let doc;
      if (mode === "pdf") {
        doc = await documentsApi.upload(file);
      } else {
        doc = await documentsApi.createText({ title: title.trim(), text });
      }
      // 2. Run the analysis pipeline
      try {
        await documentsApi.process(doc.id, language);
        notify("Document processed successfully.", "success");
      } catch (procErr) {
        // Ingestion succeeded but analysis failed (e.g. missing API key).
        notify(procErr.friendlyMessage || "Analysis could not be completed.", "error");
      }
      navigate(`/documents/${doc.id}`);
    } catch (err) {
      notify(err.friendlyMessage || "Upload failed.", "error");
    } finally {
      stopStages();
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Upload a document</h1>
        <p className="mt-1 text-ink-muted">
          Add a PDF or paste text from a notice, scheme or advisory to simplify it.
        </p>
      </div>

      <LlmWarning />

      {/* Mode tabs */}
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="tablist">
        <button
          role="tab" aria-selected={mode === "pdf"}
          onClick={() => setMode("pdf")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
            mode === "pdf" ? "bg-brand-700 text-white" : "text-ink-soft hover:bg-slate-100"
          }`}
        >
          <FileText size={17} /> Upload PDF
        </button>
        <button
          role="tab" aria-selected={mode === "text"}
          onClick={() => setMode("text")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
            mode === "text" ? "bg-brand-700 text-white" : "text-ink-soft hover:bg-slate-100"
          }`}
        >
          <Type size={17} /> Paste text
        </button>
      </div>

      <Card className="p-6">
        {mode === "pdf" ? (
          !file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
                dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <UploadCloud size={28} aria-hidden="true" />
              </div>
              <p className="mt-4 text-lg font-semibold text-ink">Drag &amp; drop your PDF here</p>
              <p className="text-sm text-ink-muted">or</p>
              <button className="btn-primary mt-2" onClick={() => fileInput.current?.click()}>
                Choose PDF
              </button>
              <input
                ref={fileInput} type="file" accept="application/pdf,.pdf" className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <p className="mt-4 text-xs text-ink-muted">Maximum file size: {maxMb} MB · Text-based PDFs only</p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText size={28} className="shrink-0 text-brand-700" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{file.name}</p>
                  <p className="text-xs text-ink-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)} className="btn-ghost" aria-label="Remove file" disabled={busy}
              >
                <X size={18} />
              </button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <Field label="Document title" htmlFor="title">
              <input
                id="title" className="input" value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pension Scheme Notice"
              />
            </Field>
            <Field label="Paste the text" htmlFor="text" hint="Paste the official text you want simplified.">
              <textarea
                id="text" rows={9} className="input resize-y"
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Paste government notice, scheme details or advisory text here…"
              />
            </Field>
          </div>
        )}
      </Card>

      {/* Language + submit */}
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:max-w-xs sm:flex-1">
          <Field label="Simplify in" htmlFor="language" hint="The explanation will be written in this language.">
            <LanguageSelect value={language} onChange={setLanguage} languages={meta.languages} />
          </Field>
        </div>
        <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
          {busy ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : "Simplify & verify"}
        </Button>
      </Card>

      {/* Processing overlay */}
      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" role="status" aria-live="polite">
          <Card className="w-full max-w-sm p-6 text-center">
            <Loader2 size={34} className="mx-auto animate-spin text-brand-700" aria-hidden="true" />
            <p className="mt-4 font-semibold text-ink">{STAGES[stage]}</p>
            <p className="mt-1 text-sm text-ink-muted">This can take a little while for longer documents.</p>
            <ul className="mt-4 space-y-1.5 text-left text-sm">
              {STAGES.map((s, i) => (
                <li key={s} className={`flex items-center gap-2 ${i <= stage ? "text-ink" : "text-slate-400"}`}>
                  {i < stage ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : i === stage ? (
                    <Loader2 size={16} className="animate-spin text-brand-600" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-slate-300" />
                  )}
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
