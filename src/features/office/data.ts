/**
 * The Office feature — data layer (live).
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOfficeData } from "@/lib/dashboard.functions";
import { getDateRange } from "@/lib/format";
import type { DashboardSearch } from "@/lib/dashboard-search";

const EMPTY = {
  netSales: 0, netSalesDelta: 0, food: 0, beverage: 0,
  labor: 0, laborPct: 0, cogs: 0, cogsPct: 0,
  fixed: 0, profit: 0, profitDelta: 0, margin: 0,
  series: [] as { date: string; value: number; covers: number; labor: number; cogs: number }[],
  pnlRows: [] as { label: string; value: number; pct: number; bold?: boolean }[],
};

export function useOfficeData(search: DashboardSearch) {
  const fn = useServerFn(getOfficeData);
  const range = getDateRange(search.range);
  const query = useQuery({
    queryKey: ["office", range, search.center],
    queryFn: () => fn({ data: { ...range, center: search.center } }),
  });
  return { ...(query.data ?? EMPTY), isLoading: query.isPending, error: query.error };
}
