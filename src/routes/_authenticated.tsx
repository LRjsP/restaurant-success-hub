import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardSearchSchema } from "@/lib/dashboard-search";
import { zodValidator } from "@tanstack/zod-adapter";

export const Route = createFileRoute("/_authenticated")({
  validateSearch: zodValidator(dashboardSearchSchema),
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
