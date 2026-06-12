import { createFileRoute } from "@tanstack/react-router";
import { OfficePage } from "@/features/office/OfficePage";

export const Route = createFileRoute("/_authenticated/office")({
  component: OfficePage,
});
