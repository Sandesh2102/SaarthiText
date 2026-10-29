import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Spinner } from "../components/ui/primitives";
import LanguageSelect from "../components/ui/LanguageSelect";
import { AuthShell } from "./Login";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Signup() {
  const { signup, meta } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    preferred_language: "English",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      notify("Password must be at least 6 characters.", "error");
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      notify("Account created. Welcome to SaarthiText!", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      notify(err.friendlyMessage || "Sign up failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start simplifying public information in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="full_name">
          <input
            id="full_name" type="text" required autoComplete="name" className="input"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Your name"
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email" type="email" required autoComplete="email" className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 6 characters.">
          <input
            id="password" type="password" required autoComplete="new-password" className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Create a password"
          />
        </Field>
        <Field label="Preferred language" htmlFor="language" hint="Used for your simplified explanations.">
          <LanguageSelect
            value={form.preferred_language}
            onChange={(v) => setForm({ ...form, preferred_language: v })}
            languages={meta.languages}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Spinner size={18} /> Creating account…</> : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
