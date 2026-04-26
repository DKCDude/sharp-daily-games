import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetCurrentAuthUser, useGetCrossnumbersReminder, getGetCrossnumbersReminderQueryKey } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import { useEffect, useRef } from "react";

import { ErrorBoundary } from "@/components/error-boundary";
import { Layout } from "@/components/layout";
import { DevPanel } from "@/components/dev-panel";
import HomePage from "@/pages/home";
import LeaderboardPage from "@/pages/leaderboard";
import HistoryPage from "@/pages/history";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function GlobalReminder() {
  const { data: auth } = useGetCurrentAuthUser();
  const { data: reminder } = useGetCrossnumbersReminder({
    query: {
      queryKey: getGetCrossnumbersReminderQueryKey(),
      enabled: !!auth?.isAuthenticated,
    }
  });

  const scheduledRef = useRef(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (!reminder?.enabled) return;
    if (Notification.permission !== "granted") return;
    if (scheduledRef.current) return;

    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(reminder.hourLocal, reminder.minuteLocal, 0, 0);

    if (targetTime.getTime() > now.getTime()) {
      const msUntilTarget = targetTime.getTime() - now.getTime();
      scheduledRef.current = true;
      const id = window.setTimeout(() => {
        try {
          new Notification("Crossnumbers — your daily puzzle is waiting", { icon: "/favicon.svg" });
        } catch {
          // ignore
        }
        scheduledRef.current = false;
      }, msUntilTarget);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [reminder]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { data: auth, isLoading } = useGetCurrentAuthUser();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!auth?.isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute component={HomePage} />
      </Route>
      <Route path="/leaderboard">
        <ProtectedRoute component={LeaderboardPage} />
      </Route>
      <Route path="/history">
        <ProtectedRoute component={HistoryPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GlobalReminder />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <DevPanel />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
