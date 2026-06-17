import { createFileRoute } from "@tanstack/react-router";
import { PipelinePage } from "@/features/pipeline/PipelinePage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
  errorComponent: RouteErrorBoundary,
});
