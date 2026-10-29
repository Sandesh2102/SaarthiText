import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload, FileText, ShieldCheck, Gauge, ArrowRight, Plus, AlertTriangle,
} from "lucide-react";
import { Button, Card, EmptyState, Skeleton } from "../components/ui/primitives";
import StatusBadge from "../components/ui/StatusBadge";
import LlmWarning from "../components/ui/LlmWarning";
import { useAuth } from "../context/AuthContext";
import { documentsApi } from "../api/documents";
import { authApi } from "../api/auth";
import { formatDate } from "../utils/helpers";

function StatCard({ icon: Icon, label, value, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={22} aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ink">{value}</p>
        <p className="text-sm text-ink-muted">{label}</p>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    documentsApi.list({ sort: "newest" }).then((d) => setDocs(d.slice(0, 5))).catch(() => setDocs([]));
    authApi.stats().then(setStats).catch(() => setStats(null));
  }, []);

  const firstName = (user?.full_name || "there").split(" ")[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-ink-muted">Understand your public information easily.</p>
        </div>
        <Button to="/upload">
          <Plus size={18} /> New document
        </Button>
      </div>

      <LlmWarning />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard icon={FileText} label="Documents" value={stats.documents_processed} tone="brand" />
            <StatCard icon={Upload} label="Simplified" value={stats.simplifications_completed} tone="slate" />
            <StatCard icon={ShieldCheck} label="Facts verified" value={stats.facts_verified} tone="emerald" />
            <StatCard icon={AlertTriangle} label="Conflicts found" value={stats.conflicts_found} tone="amber" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[88px]" />)
        )}
      </div>

      {/* Upload prompt */}
      <Card className="flex flex-col items-start justify-between gap-4 bg-brand-700 p-6 text-white sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold">Have a notice or scheme to understand?</h2>
          <p className="mt-1 text-sm text-brand-100">
            Upload a PDF or paste the text — we’ll simplify it and check the facts.
          </p>
        </div>
        <Button to="/upload" variant="secondary">
          Upload document <ArrowRight size={18} />
        </Button>
      </Card>

      {/* Recent documents */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Recent documents</h2>
          <Link to="/documents" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>

        {docs === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload your first public-information document to see it simplified and verified here."
            action={<Button to="/upload"><Upload size={18} /> Upload document</Button>}
          />
        ) : (
          <Card className="overflow-hidden">
            {/* Table on larger screens */}
            <table className="hidden w-full text-left sm:table">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Document</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-ink">{d.title}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-sm text-ink-muted">{formatDate(d.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => navigate(`/documents/${d.id}`)}
                        className="text-sm font-semibold text-brand-700 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Cards on mobile */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {docs.map((d) => (
                <li key={d.id}>
                  <Link to={`/documents/${d.id}`} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{d.title}</p>
                      <p className="text-xs text-ink-muted">{formatDate(d.created_at)}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
