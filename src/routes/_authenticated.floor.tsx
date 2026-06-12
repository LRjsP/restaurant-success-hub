import { createFileRoute } from "@tanstack/react-router";
import { FloorPage } from "@/features/floor/FloorPage";

export const Route = createFileRoute("/_authenticated/floor")({
  component: FloorPage,
});
