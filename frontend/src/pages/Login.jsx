import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "../components/layout/Brand";
import { Button, Field, Spinner } from "../components/ui/primitives";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="container-page py-6">
        <Brand />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <p className="mt-5 text-center text-sm text-ink-muted">{footer}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      notify("Welcome back!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      notify(err.friendlyMessage || "Login failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Access your documents and simplifications."
      footer={
        <>
          New to SaarthiText?{" "}
          <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <input
            id="email" type="email" required autoComplete="email" className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password" type="password" required autoComplete="current-password" className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Your password"
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Spinner size={18} /> Logging in…</> : "Log in"}
        </Button>
      </form>
    </AuthShell>
  );
}

export { AuthShell };
