import { createFileRoute } from "@tanstack/react-router";
import { ArchitectPage } from "@/features/architect/ArchitectPage";

export const Route = createFileRoute("/_authenticated/architect")({
  component: ArchitectPage,
});
