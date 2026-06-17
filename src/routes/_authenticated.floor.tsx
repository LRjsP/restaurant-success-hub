import { createFileRoute } from "@tanstack/react-router";
import { FloorPage } from "@/features/floor/FloorPage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const Route = createFileRoute("/_authenticated/floor")({
  component: FloorPage,
  errorComponent: RouteErrorBoundary,
});
