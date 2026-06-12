/**
 * The Office feature — data layer.
 * Builds P&L summary, daily revenue-vs-cost series, and operating margin.
 */
import { useMemo } from "react";
import { generateDemoDays, computeOfficePnl, daysForPreset } from "@/lib/demo-data";
import type { DashboardSearch } from "@/lib/dashboard-search";

export function useOfficeData(search: DashboardSearch) {
  return useMemo(() => {
    const span = daysForPreset(search.range);
    const days = generateDemoDays(span, search.center);
    const prev = generateDemoDays(span, search.center, span);
    return computeOfficePnl(days, prev);
  }, [search.range, search.center]);
}
