import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign In — MISE.OPS" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
  },
});
