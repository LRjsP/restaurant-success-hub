import { createFileRoute, redirect } from "@tanstack/react-router";
import { UserConfigPage } from "@/features/users/UserConfigPage";
import { getMyRole } from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "User Config — MISE.OPS" }] }),
  beforeLoad: async () => {
    try {
      const me = await getMyRole();
      if (!me.isAdmin) {
        throw redirect({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
      }
    } catch (err: any) {
      if (err?.isRedirect) throw err;
      throw redirect({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
    }
  },
  component: UserConfigPage,
});
