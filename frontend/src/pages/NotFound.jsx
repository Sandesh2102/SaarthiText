import { Link } from "react-router-dom";
import { Button } from "../components/ui/primitives";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-6xl font-extrabold text-brand-700">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Button to="/">Back to home</Button>
        <Link to="/dashboard" className="btn-secondary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
