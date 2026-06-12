import { createFileRoute } from "@tanstack/react-router";
import { PipelinePage } from "@/features/pipeline/PipelinePage";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
});
