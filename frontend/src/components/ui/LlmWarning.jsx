import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Honest banner shown when the backend reports the LLM is not configured.
// We never fake AI output — instead we tell the user exactly what to do.
export default function LlmWarning({ className = "" }) {
  const { meta } = useAuth();
  if (meta?.llm_configured) return null;
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 ${className}`}
      role="alert"
    >
      <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">AI simplification is not configured yet</p>
        <p className="mt-0.5 text-amber-800">
          Add an API key for the <strong>{meta?.llm_provider || "LLM"}</strong> provider in{" "}
          <code className="rounded bg-amber-100 px-1">backend/.env</code> and restart the server.
          Uploading and text extraction work now; simplification &amp; verification need the key.
        </p>
      </div>
    </div>
  );
}
