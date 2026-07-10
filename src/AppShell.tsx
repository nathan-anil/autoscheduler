import type { ReactNode } from "react";
import {
  CalendarCheck,
  Home,
  ClipboardList,
  CalendarRange,
  LogOut,
} from "lucide-react";

import { useAppState } from "./context/AppStateContext";
import "./Dashboard.css";

export type AppPage = "dashboard" | "setup" | "weekly-schedule";

const navItems: { id: AppPage; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "setup", label: "Setup", icon: ClipboardList },
  { id: "weekly-schedule", label: "Weekly Schedule", icon: CalendarRange },
];

type AppShellProps = {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  children: ReactNode;
};

export default function AppShell({
  activePage,
  onNavigate,
  children,
}: AppShellProps) {
  const { logout } = useAppState();

  return (
    <div className="autoschedule-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <CalendarCheck size={28} strokeWidth={2.2} />
          </div>
          <span>AutoSchedule</span>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout" onClick={logout}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
