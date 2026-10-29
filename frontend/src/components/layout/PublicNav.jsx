import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Brand from "./Brand";
import { Button } from "../ui/primitives";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { label: "Home", href: "#top" },
  { label: "How It Works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Primary">
        <Brand />
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button to="/dashboard">Go to dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" to="/login">Log in</Button>
              <Button to="/signup">Get started</Button>
            </>
          )}
        </div>
        <button
          className="btn-ghost md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ink-soft hover:bg-slate-100"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
              ) : (
                <>
                  <Button variant="secondary" to="/login">Log in</Button>
                  <Button to="/signup">Get started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
