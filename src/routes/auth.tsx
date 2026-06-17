import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { AuthPage } from "@/features/auth/AuthPage";
import { RouteErrorBoundary } from "@/components/dashboard/ErrorState";

export const authSearchSchema = z.object({
  reason: z.enum(["expired"]).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — MISE.OPS" }] }),
  validateSearch: zodValidator(authSearchSchema),
  component: AuthPage,
  errorComponent: RouteErrorBoundary,
});
