import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardSearchSchema } from "@/lib/dashboard-search";
import { zodValidator } from "@tanstack/zod-adapter";

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
});

function AuthLayout() {
  const search = Route.useSearch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        window.location.href = "/auth";
      }
    });
    setReady(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  return (
    <DashboardShell search={search}>
      <Outlet />
    </DashboardShell>
  );
}
