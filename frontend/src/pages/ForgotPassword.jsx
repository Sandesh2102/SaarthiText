import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Spinner } from "../components/ui/primitives";
import { AuthShell } from "./Login";
import { authApi } from "../api/auth";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", new_password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 6) {
      notify("Password must be at least 6 characters.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(form);
      notify(res.detail || "Password updated.", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      notify(err.friendlyMessage || "Could not reset password.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and choose a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Back to login
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
        <Field label="New password" htmlFor="new_password" hint="At least 6 characters.">
          <input
            id="new_password" type="password" required autoComplete="new-password" className="input"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            placeholder="Choose a new password"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Spinner size={18} /> Updating…</> : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
