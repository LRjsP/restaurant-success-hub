import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/architect")({
  component: () => (
    <div className="font-mono text-sm text-muted-foreground">
      The Architect — Yield &amp; Menu. Coming next.
    </div>
  ),
});
