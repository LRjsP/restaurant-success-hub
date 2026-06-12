/**
 * The Pipeline feature — data layer.
 * Computes pipeline rollups (totals, win rate, by-stage funnel, upcoming list).
 */
import { useMemo } from "react";
import { generatePipeline, daysForPreset, type PipelineEvent } from "@/lib/demo-data";
import type { DashboardSearch } from "@/lib/dashboard-search";

export const STAGES: PipelineEvent["stage"][] = ["Inquiry", "Proposal", "Confirmed", "Deposit Paid", "Lost"];

export const STAGE_COLOR: Record<PipelineEvent["stage"], string> = {
  Inquiry: "var(--color-muted-foreground)",
  Proposal: "var(--color-chart-3)",
  Confirmed: "var(--color-chart-1)",
  "Deposit Paid": "var(--color-success)",
  Lost: "var(--color-destructive)",
};

export function usePipelineData(search: DashboardSearch) {
  return useMemo(() => {
    const events = generatePipeline(search.range);
    const span = daysForPreset(search.range);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const horizonEnd = new Date(today);
    horizonEnd.setUTCDate(horizonEnd.getUTCDate() + span);

    const inHorizon = events.filter((e) => new Date(e.date) >= today && new Date(e.date) <= horizonEnd);
    const totalPipeline = events.filter((e) => e.stage !== "Lost").reduce((a, e) => a + e.value, 0);
    const confirmedValue = events
      .filter((e) => e.stage === "Confirmed" || e.stage === "Deposit Paid")
      .reduce((a, e) => a + e.value, 0);
    const winRate = events.length ? (events.filter((e) => e.stage === "Deposit Paid").length / events.length) * 100 : 0;
    const upcomingGuests = inHorizon.reduce((a, e) => a + e.guests, 0);

    const byStage = STAGES.map((s) => ({
      stage: s,
      count: events.filter((e) => e.stage === s).length,
      value: events.filter((e) => e.stage === s).reduce((a, e) => a + e.value, 0),
    }));
    const maxStageValue = Math.max(...byStage.map((s) => s.value), 1);

    const upcoming = events
      .filter((e) => e.stage !== "Lost")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);

    const activeCount = events.filter((e) => e.stage !== "Lost").length;

    return { events, span, totalPipeline, confirmedValue, winRate, upcomingGuests, byStage, maxStageValue, upcoming, activeCount };
  }, [search.range]);
}
