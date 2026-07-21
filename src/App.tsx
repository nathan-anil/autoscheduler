import { useEffect } from "react";

import AppShell, { type AppPage } from "./AppShell";
import { AppStateProvider, useAppState } from "./context/AppStateContext";
import DashboardHome from "./DashboardHome";
import LoginPage from "./LoginPage";
import SetupPage from "./SetupPage";
import WeeklySchedulePage from "./WeeklySchedulePage";

const hashByPage: Record<AppPage, string> = {
  dashboard: "#/",
  setup: "#/setup",
  "weekly-schedule": "#/schedule",
};

function pageFromHash(hash: string): AppPage | null {
  const path = hash.replace(/^#\/?/, "").split("?")[0];
  if (!path) return null;
  if (path === "setup") return "setup";
  if (path === "schedule" || path === "weekly-schedule") return "weekly-schedule";
  if (path === "dashboard") return "dashboard";
  return null;
}

function AppRoutes() {
  const { state, login, setPage } = useAppState();
  const page: AppPage = state.ui.page ?? "dashboard";

  useEffect(() => {
    const fromHash = pageFromHash(window.location.hash);
    if (fromHash && fromHash !== page) {
      setPage(fromHash);
      return;
    }

    const expected = hashByPage[page];
    if (window.location.hash !== expected) {
      window.history.replaceState(null, "", expected);
    }
  }, [page, setPage]);

  useEffect(() => {
    function onHashChange() {
      const fromHash = pageFromHash(window.location.hash);
      if (fromHash) setPage(fromHash);
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [setPage]);

  function navigate(next: AppPage) {
    setPage(next);
    const expected = hashByPage[next];
    if (window.location.hash !== expected) {
      window.location.hash = expected;
    }
  }

  if (!state.auth.isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppShell activePage={page} onNavigate={navigate}>
      {page === "dashboard" && <DashboardHome onNavigate={navigate} />}
      {page === "setup" && <SetupPage onNavigate={navigate} />}
      {page === "weekly-schedule" && (
        <WeeklySchedulePage onNavigate={navigate} />
      )}
    </AppShell>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppRoutes />
    </AppStateProvider>
  );
}

export default App;
