import { createFileRoute } from "@tanstack/react-router";
import { FloorPage } from "@/features/floor/FloorPage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

const URL = "https://seat-to-shelf-guru-mise-ops.lovable.app/floor";
const TITLE = "The Floor — Daily Service Pulse | MISE.OPS";
const DESC = "Real-time service performance — covers, net sales, PPA, and day-by-time demand patterns across every revenue center.";

export const Route = createFileRoute("/_authenticated/floor")({
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
  component: FloorPage,
  errorComponent: RouteErrorBoundary,
});
