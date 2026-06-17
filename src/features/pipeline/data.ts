/**
 * The Pipeline feature — data layer (live).
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPipelineData } from "@/lib/dashboard.functions";
import { getDateRange } from "@/lib/format";
import type { DashboardSearch } from "@/lib/dashboard-search";
import type { PipelineEvent, PipelineStage } from "@/lib/dashboard-types";

export const STAGES: PipelineStage[] = ["Inquiry", "Proposal", "Confirmed", "Deposit Paid", "Lost"];

export const STAGE_COLOR: Record<PipelineStage, string> = {
  Inquiry: "var(--color-muted-foreground)",
  Proposal: "var(--color-chart-3)",
  Confirmed: "var(--color-chart-1)",
  "Deposit Paid": "var(--color-success)",
  Lost: "var(--color-destructive)",
};

const EMPTY = {
  events: [] as PipelineEvent[],
  span: 7,
  totalPipeline: 0,
  confirmedValue: 0,
  winRate: 0,
  upcomingGuests: 0,
  byStage: STAGES.map((stage) => ({ stage, count: 0, value: 0 })),
  maxStageValue: 1,
  upcoming: [] as PipelineEvent[],
  activeCount: 0,
};

export function usePipelineData(search: DashboardSearch) {
  const fn = useServerFn(getPipelineData);
  const range = getDateRange(search.range);
  const query = useQuery({
    queryKey: ["pipeline", range, search.center],
    queryFn: () => fn({ data: { ...range, center: search.center } }),
  });
  return { ...(query.data ?? EMPTY), isLoading: query.isPending, error: query.error };
}
