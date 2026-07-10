import { useState } from "react";

import AppShell, { type AppPage } from "./AppShell";
import { AppStateProvider, useAppState } from "./context/AppStateContext";
import DashboardHome from "./DashboardHome";
import LoginPage from "./LoginPage";
import SetupPage from "./SetupPage";
import WeeklySchedulePage from "./WeeklySchedulePage";

function AppRoutes() {
  const { state, login } = useAppState();
  const [page, setPage] = useState<AppPage>(() => {
    if (state.schedule.blocks.length > 0) return "dashboard";
    return "setup";
  });

  if (!state.auth.isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      {page === "dashboard" && <DashboardHome onNavigate={setPage} />}
      {page === "setup" && <SetupPage onNavigate={setPage} />}
      {page === "weekly-schedule" && (
        <WeeklySchedulePage onNavigate={setPage} />
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
