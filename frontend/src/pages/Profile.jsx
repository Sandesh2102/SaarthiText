import { useEffect, useState } from "react";
import { User, Mail, Globe, Save, Loader2, FileText, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, Button, Field, Skeleton } from "../components/ui/primitives";
import LanguageSelect from "../components/ui/LanguageSelect";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api/auth";
import { LANGUAGE_LABELS } from "../utils/helpers";

const STAT_CARDS = [
  { key: "documents_processed", label: "Documents processed", icon: FileText },
  { key: "simplifications_completed", label: "Simplifications", icon: Sparkles },
  { key: "facts_verified", label: "Facts verified", icon: ShieldCheck },
  { key: "conflicts_found", label: "Conflicts found", icon: AlertTriangle },
];

export default function Profile() {
  const { user, setUser, meta } = useAuth();
  const { notify } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [language, setLanguage] = useState(user?.preferred_language || "English");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    authApi.stats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setLanguage(user.preferred_language);
    }
  }, [user]);

  const dirty = user && (fullName.trim() !== user.full_name || language !== user.preferred_language);

  const save = async () => {
    if (fullName.trim().length < 2) return notify("Please enter your name.", "error");
    setSaving(true);
    try {
      const updated = await authApi.updateMe({
        full_name: fullName.trim(),
        preferred_language: language,
      });
      setUser(updated);
      notify("Profile updated.", "success");
    } catch (err) {
      notify(err.friendlyMessage || "Could not update your profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Profile</h1>
        <p className="mt-1 text-ink-muted">Manage your account details and reading-language preference.</p>
      </div>

      {/* Activity */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className="p-4">
              <Icon size={18} className="text-brand-600" aria-hidden="true" />
              <p className="mt-2 text-2xl font-extrabold text-ink">
                {stats ? stats[s.key] : <span className="text-ink-muted">—</span>}
              </p>
              <p className="text-xs text-ink-muted">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Account details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-ink">Account details</h2>
        <div className="mt-4 space-y-4">
          <Field label="Full name" htmlFor="full_name">
            <div className="relative">
              <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                id="full_name" className="input pl-10" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Email" htmlFor="email" hint="Your email address cannot be changed.">
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input id="email" className="input pl-10 bg-slate-50 text-ink-muted" value={user.email} disabled />
            </div>
          </Field>

          <Field label="Preferred language" htmlFor="language" hint="New documents will default to this language.">
            <LanguageSelect value={language} onChange={setLanguage} languages={meta?.languages} />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={save} disabled={!dirty || saving}>
              {saving ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
              Save changes
            </Button>
            {dirty && !saving && <span className="text-sm text-ink-muted">You have unsaved changes.</span>}
          </div>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-5">
        <Globe size={20} className="text-brand-600" aria-hidden="true" />
        <p className="text-sm text-ink-soft">
          Currently reading in <strong className="text-ink">{LANGUAGE_LABELS[user.preferred_language] || user.preferred_language}</strong>.
        </p>
      </Card>
    </div>
  );
}
