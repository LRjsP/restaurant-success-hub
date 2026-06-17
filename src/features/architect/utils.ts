import type { MenuItem } from "@/lib/dashboard-types";

export const CLASS_COLOR: Record<MenuItem["classification"], string> = {
  Star: "var(--color-success)",
  Plowhorse: "var(--color-chart-3)",
  Puzzle: "var(--color-warning)",
  Dog: "var(--color-destructive)",
};

export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type SortKey = "name" | "sold" | "margin" | "marginPct" | "revenue";
