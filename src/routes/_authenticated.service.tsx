import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/features/service/ServicePage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

const URL = "https://seat-to-shelf-guru-mise-ops.lovable.app/service";
const TITLE = "The Service — Order Entry | MISE.OPS";
const DESC = "Cashier and waiter terminal. Submit dine-in, takeout, delivery, and catering tickets that feed every dashboard in real time.";

export const Route = createFileRoute("/_authenticated/service")({
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
  component: ServicePage,
  errorComponent: RouteErrorBoundary,
});
