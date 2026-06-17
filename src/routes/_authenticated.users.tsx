import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { UserConfigPage } from "@/features/users/UserConfigPage";
import { getMyRole } from "@/lib/users.functions";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

const FLOOR_SEARCH = { range: "7d" as const, center: "all" as const, compare: true };

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "User Config — MISE.OPS" }] }),
  beforeLoad: async () => {
    try {
      const me = await getMyRole();
      if (!me.isAdmin) throw redirect({ to: "/floor", search: FLOOR_SEARCH });
    } catch (err) {
      if (isRedirect(err)) throw err;
      throw redirect({ to: "/floor", search: FLOOR_SEARCH });
    }
  },
  component: UserConfigPage,
  errorComponent: RouteErrorBoundary,
});

