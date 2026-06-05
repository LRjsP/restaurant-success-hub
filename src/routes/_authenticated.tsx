import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardSearchSchema } from "@/lib/dashboard-search";
import { zodValidator } from "@tanstack/zod-adapter";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  validateSearch: zodValidator(dashboardSearchSchema),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const search = Route.useSearch();
  return (
    <DashboardShell search={search}>
      <Outlet />
    </DashboardShell>
  );
}
