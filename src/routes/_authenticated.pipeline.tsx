import { createFileRoute } from "@tanstack/react-router";
import { PipelinePage } from "@/features/pipeline/PipelinePage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

const URL = "https://seat-to-shelf-guru-mise-ops.lovable.app/pipeline";
const TITLE = "The Pipeline — Events & Catering CRM | MISE.OPS";
const DESC = "Events and catering CRM — track leads, win rate, booked revenue, and total pipeline value across every stage.";

export const Route = createFileRoute("/_authenticated/pipeline")({
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
  component: PipelinePage,
  errorComponent: RouteErrorBoundary,
});
