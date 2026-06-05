import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

export const dashboardSearchSchema = z.object({
  range: fallback(z.enum(["today", "7d", "30d", "90d", "ytd"]), "7d").default("7d"),
  center: fallback(z.string(), "all").default("all"),
  compare: fallback(z.boolean(), true).default(true),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;
