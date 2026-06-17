import { createFileRoute } from "@tanstack/react-router";
import { OfficePage } from "@/features/office/OfficePage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

const URL = "https://seat-to-shelf-guru-mise-ops.lovable.app/office";
const TITLE = "The Office — Weekly P&L | MISE.OPS";
const DESC = "Financial health — labor %, COGS %, prime cost, and weekly profit-and-loss summary for your restaurant.";

export const Route = createFileRoute("/_authenticated/office")({
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
  component: OfficePage,
  errorComponent: RouteErrorBoundary,
});
