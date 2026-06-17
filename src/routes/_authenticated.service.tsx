import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/features/service/ServicePage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const Route = createFileRoute("/_authenticated/service")({
  component: ServicePage,
  errorComponent: RouteErrorBoundary,
});
