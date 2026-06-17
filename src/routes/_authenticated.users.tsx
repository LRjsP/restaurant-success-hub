import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { UserConfigPage } from "@/features/users/UserConfigPage";
import { getMyRole } from "@/lib/users.functions";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

const FLOOR_SEARCH = { range: "7d" as const, center: "all" as const, compare: true };

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "User Config — MISE.OPS" },
      {
        name: "description",
        content:
          "Manage MISE.OPS team members: invite staff, assign admin or staff roles, and remove access for your restaurant workspace.",
      },
      { property: "og:title", content: "User Config — MISE.OPS" },
      {
        property: "og:description",
        content:
          "Invite teammates, assign roles, and control who can access your MISE.OPS restaurant operations workspace.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
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

