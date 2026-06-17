/**
 * The Architect feature — data layer (live).
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getArchitectData } from "@/lib/dashboard.functions";
import { getDateRange } from "@/lib/format";
import type { DashboardSearch } from "@/lib/dashboard-search";
import type { MenuItem } from "@/lib/dashboard-types";

const EMPTY = {
  items: [] as MenuItem[],
  totalRevenue: 0,
  totalMargin: 0,
  blendedPct: 0,
  stars: 0,
  dogs: 0,
  medianSold: 0,
  medianMargin: 0,
};

export function useArchitectData(search: DashboardSearch) {
  const fn = useServerFn(getArchitectData);
  const range = getDateRange(search.range);
  const query = useQuery({
    queryKey: ["architect", range, search.center],
    queryFn: () => fn({ data: { ...range, center: search.center } }),
  });
  return { ...(query.data ?? EMPTY), isLoading: query.isPending, error: query.error };
}
