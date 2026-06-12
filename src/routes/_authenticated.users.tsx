import { createFileRoute } from "@tanstack/react-router";
import { UserConfigPage } from "@/features/users/UserConfigPage";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "User Config — MISE.OPS" }] }),
  component: UserConfigPage,
});
