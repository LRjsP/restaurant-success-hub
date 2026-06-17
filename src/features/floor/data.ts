/**
 * Floor feature — data layer (live).
 * Wraps the getFloorData server function and returns a stable shape so the
 * presentational components render zero-state while data loads.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFloorData } from "@/lib/dashboard.functions";
import { getDateRange } from "@/lib/format";
import type { DashboardSearch } from "@/lib/dashboard-search";

const EMPTY = {
  kpis: {
    netSales: 0, netSalesDelta: 0, covers: 0, coversDelta: 0,
    ppa: 0, ppaDelta: 0, avgCheck: 0, avgCheckDelta: 0,
    discountPct: 0, discountPctDelta: 0, noShowRate: 0,
    trend: [] as { date: string; value: number; covers: number }[],
  },
  alerts: [] as { severity: "danger" | "warning" | "info"; message: string; time: string }[],
};

export function useFloorData(search: DashboardSearch) {
  const fn = useServerFn(getFloorData);
  const range = getDateRange(search.range);
  const query = useQuery({
    queryKey: ["floor", range, search.center],
    queryFn: () => fn({ data: { ...range, center: search.center } }),
  });
  return { ...(query.data ?? EMPTY), isLoading: query.isPending, error: query.error };
}
