import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/floor")({
  component: FloorPage,
});

function FloorPage() {
  return (
    <div className="font-mono text-sm text-muted-foreground">
      The Floor — Daily Pulse. KPI tiles coming next.
    </div>
  );
}
