import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardSearchSchema } from "@/lib/dashboard-search";
import { zodValidator } from "@tanstack/zod-adapter";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const Route = createFileRoute("/_authenticated")({
  validateSearch: zodValidator(dashboardSearchSchema),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthLayout,
  errorComponent: RouteErrorBoundary,
});

function AuthLayout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate({ to: "/auth", search: { reason: "expired" }, replace: true });
        return;
      }
      if (event === "TOKEN_REFRESHED" && !session) {
        navigate({ to: "/auth", search: { reason: "expired" }, replace: true });
      }
    });
    setReady(true);
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return null;

  return (
    <DashboardShell search={search}>
      <Outlet />
    </DashboardShell>
  );
}
