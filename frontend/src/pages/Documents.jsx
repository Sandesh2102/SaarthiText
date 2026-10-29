import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Trash2, FileText, Upload, Plus } from "lucide-react";
import { Button, Card, EmptyState, Skeleton } from "../components/ui/primitives";
import StatusBadge from "../components/ui/StatusBadge";
import { documentsApi } from "../api/documents";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/helpers";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "verified", label: "Verified" },
  { value: "warning", label: "Needs review" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

export default function Documents() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [docs, setDocs] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [confirmId, setConfirmId] = useState(null);

  const load = () => {
    setDocs(null);
    documentsApi
      .list({ search: search || undefined, status: status || undefined, sort })
      .then(setDocs)
      .catch(() => setDocs([]));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sort]);

  const remove = async (id) => {
    try {
      await documentsApi.remove(id);
      notify("Document deleted.", "success");
      setConfirmId(null);
      load();
    } catch (err) {
      notify(err.friendlyMessage || "Could not delete document.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">My documents</h1>
          <p className="mt-1 text-ink-muted">Search, review and manage your processed documents.</p>
        </div>
        <Button to="/upload"><Plus size={18} /> New document</Button>
      </div>

      {/* Controls */}
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            className="input pl-10" placeholder="Search documents…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            aria-label="Search documents"
          />
        </div>
        <select
          className="input md:w-48" value={status} onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          className="input md:w-44" value={sort} onChange={(e) => setSort(e.target.value)}
          aria-label="Sort documents"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </Card>

      {docs === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || status ? "No matching documents" : "No documents yet"}
          description={search || status ? "Try adjusting your search or filters." : "Upload your first document to get started."}
          action={<Button to="/upload"><Upload size={18} /> Upload document</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="hidden w-full text-left md:table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Document</th>
                <th className="px-5 py-3 font-semibold">Language</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/documents/${d.id}`} className="font-medium text-ink hover:text-brand-700">
                      {d.title}
                    </Link>
                    <span className="ml-2 text-xs uppercase text-ink-muted">{d.source_type}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-ink-soft">{d.target_language}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3 text-sm text-ink-muted">{formatDate(d.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/documents/${d.id}`)}
                        className="text-sm font-semibold text-brand-700 hover:underline">View</button>
                      <button onClick={() => setConfirmId(d.id)}
                        className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${d.title}`}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 p-4">
                <Link to={`/documents/${d.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{d.title}</p>
                  <p className="text-xs text-ink-muted">{d.target_language} · {formatDate(d.created_at)}</p>
                </Link>
                <StatusBadge status={d.status} />
                <button onClick={() => setConfirmId(d.id)} aria-label={`Delete ${d.title}`}
                  className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Delete confirmation */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-ink">Delete this document?</h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              This permanently removes the document and all its analysis. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="btn bg-red-600 px-5 py-2.5 text-white hover:bg-red-700" onClick={() => remove(confirmId)}>
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
