import { createFileRoute } from "@tanstack/react-router";
import { ArchitectPage } from "@/features/architect/ArchitectPage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const Route = createFileRoute("/_authenticated/architect")({
  component: ArchitectPage,
  errorComponent: RouteErrorBoundary,
});
