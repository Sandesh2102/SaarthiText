import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Upload, FileText, User, LogOut, Menu, X,
} from "lucide-react";
import Brand from "./Brand";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-brand-700 text-white"
                : "text-ink-soft hover:bg-slate-100 hover:text-ink"
            }`
          }
        >
          <Icon size={19} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = (user?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Brand to="/dashboard" />
        </div>
        <div className="mt-8 flex flex-1 flex-col">
          <NavItems />
          <button onClick={handleLogout} className="btn-ghost mt-2 justify-start text-sm">
            <LogOut size={19} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Brand to="/dashboard" />
        <button
          className="btn-ghost"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col bg-white px-4 py-5">
            <div className="flex items-center justify-between px-2">
              <Brand to="/dashboard" />
              <button className="btn-ghost" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <div className="mt-8 flex flex-1 flex-col">
              <NavItems onNavigate={() => setMobileOpen(false)} />
              <button onClick={handleLogout} className="btn-ghost mt-2 justify-start text-sm">
                <LogOut size={19} aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="hidden h-16 items-center justify-end border-b border-slate-200 bg-white px-8 lg:flex">
          <Link to="/profile" className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-100">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight text-ink">{user?.full_name}</p>
              <p className="text-xs leading-tight text-ink-muted">{user?.preferred_language}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {initials}
            </span>
          </Link>
        </header>
        <main className="container-page py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
