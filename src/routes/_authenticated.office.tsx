import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/office")({
  component: () => (
    <div className="font-mono text-sm text-muted-foreground">
      The Office — Weekly P&amp;L. Coming next.
    </div>
  ),
});
