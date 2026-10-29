// Shared helpers and display constants.

export const LANGUAGE_LABELS = {
  English: "English",
  Telugu: "తెలుగు",
  Hindi: "हिन्दी",
  Tamil: "தமிழ்",
  Kannada: "ಕನ್ನಡ",
  Malayalam: "മലയാളം",
  Marathi: "मराठी",
  Bengali: "বাংলা",
};

// BCP-47 codes for the browser speech-synthesis read-aloud feature.
export const SPEECH_LANG = {
  English: "en-IN",
  Telugu: "te-IN",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Marathi: "mr-IN",
  Bengali: "bn-IN",
};

export const STATUS_META = {
  pending: { label: "Pending", classes: "bg-slate-100 text-slate-700" },
  extracting: { label: "Extracting", classes: "bg-amber-100 text-amber-800" },
  processing: { label: "Processing", classes: "bg-amber-100 text-amber-800" },
  verified: { label: "Verified", classes: "bg-emerald-100 text-emerald-800" },
  warning: { label: "Needs review", classes: "bg-amber-100 text-amber-800" },
  failed: { label: "Failed", classes: "bg-red-100 text-red-700" },
};

export const VERIFICATION_META = {
  VERIFIED: { label: "Verified", classes: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  PARTIALLY_VERIFIED: { label: "Partially verified", classes: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  CONFLICT: { label: "Conflict", classes: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  NOT_FOUND: { label: "Not found", classes: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isToday) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function readabilityTone(level) {
  if (["Very Easy", "Easy"].includes(level)) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (["Fairly Easy", "Standard"].includes(level)) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}
