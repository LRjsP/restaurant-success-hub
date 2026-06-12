/**
 * Floor feature — data layer.
 * Pure data hook (no JSX). Builds period + previous-period KPIs and alerts
 * from the deterministic demo generator. Swap the body to call a real API
 * later without touching the display components.
 */
import { useMemo } from "react";
import {
  generateDemoDays,
  computeFloorKpis,
  demoAlerts,
  daysForPreset,
} from "@/lib/demo-data";
import type { DashboardSearch } from "@/lib/dashboard-search";

export function useFloorData(search: DashboardSearch) {
  return useMemo(() => {
    const span = daysForPreset(search.range);
    const days = generateDemoDays(span, search.center);
    const prev = generateDemoDays(span, search.center, span);
    const kpis = computeFloorKpis(days, prev);
    return { kpis, alerts: demoAlerts, span };
  }, [search.range, search.center]);
}
