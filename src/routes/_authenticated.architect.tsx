import { createFileRoute } from "@tanstack/react-router";
import { ArchitectPage } from "@/features/architect/ArchitectPage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

const URL = "https://seat-to-shelf-guru-mise-ops.lovable.app/architect";
const TITLE = "The Architect — Menu Engineering | MISE.OPS";
const DESC = "Item-level margin, mix, and yield optimization. Spot stars, dogs, plowhorses, and puzzles across your menu.";

export const Route = createFileRoute("/_authenticated/architect")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ArchitectPage,
  errorComponent: RouteErrorBoundary,
});
