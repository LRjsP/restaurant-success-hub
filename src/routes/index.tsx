import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
  },
});
