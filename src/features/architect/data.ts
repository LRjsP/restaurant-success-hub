/**
 * The Architect feature — data layer.
 * Aggregates the menu engineering matrix and rollup stats from demo data.
 */
import { useMemo } from "react";
import { generateDemoDays, computeMenuMatrix, daysForPreset } from "@/lib/demo-data";
import type { DashboardSearch } from "@/lib/dashboard-search";
import { median } from "./utils";

export function useArchitectData(search: DashboardSearch) {
  return useMemo(() => {
    const span = daysForPreset(search.range);
    const days = generateDemoDays(span, search.center);
    const totalCovers = days.reduce((a, d) => a + d.covers, 0);
    const items = computeMenuMatrix(totalCovers).sort((a, b) => b.margin - a.margin);

    const totalRevenue = items.reduce((a, i) => a + i.revenue, 0);
    const totalMargin = items.reduce((a, i) => a + i.margin, 0);
    const blendedPct = totalRevenue ? (totalMargin / totalRevenue) * 100 : 0;
    const stars = items.filter((i) => i.classification === "Star").length;
    const dogs = items.filter((i) => i.classification === "Dog").length;
    const medianSold = median(items.map((i) => i.sold));
    const medianMargin = median(items.map((i) => i.margin));

    return { items, totalRevenue, totalMargin, blendedPct, stars, dogs, medianSold, medianMargin };
  }, [search.range, search.center]);
}
