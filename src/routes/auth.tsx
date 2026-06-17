import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { AuthPage } from "@/features/auth/AuthPage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const authSearchSchema = z.object({
  reason: z.enum(["expired"]).optional(),
});

const URL = "https://seat-to-shelf-guru-mise-ops.lovable.app/auth";
const TITLE = "Sign In — MISE.OPS";
const DESC = "Sign in to MISE.OPS to access your restaurant operations dashboard — service, finance, menu engineering, and events.";

export const Route = createFileRoute("/auth")({
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
  validateSearch: zodValidator(authSearchSchema),
  component: AuthPage,
  errorComponent: RouteErrorBoundary,
});
