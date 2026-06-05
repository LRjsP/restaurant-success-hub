import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: () => (
    <div className="font-mono text-sm text-muted-foreground">
      The Pipeline — CRM &amp; Events. Coming next.
    </div>
  ),
});
