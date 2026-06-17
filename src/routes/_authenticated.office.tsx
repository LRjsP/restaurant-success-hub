import { createFileRoute } from "@tanstack/react-router";
import { OfficePage } from "@/features/office/OfficePage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const Route = createFileRoute("/_authenticated/office")({
  component: OfficePage,
  errorComponent: RouteErrorBoundary,
});
