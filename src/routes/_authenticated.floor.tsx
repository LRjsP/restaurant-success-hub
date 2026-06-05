import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/floor")({
  component: () => <Outlet />,
});

function FloorPage() {
  return <div className="font-mono text-sm text-muted-foreground">Floor — coming soon.</div>;
}

Route.update({ component: FloorPage });
