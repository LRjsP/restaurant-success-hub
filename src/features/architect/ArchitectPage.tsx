/**
 * The Architect — menu engineering and yield analysis.
 */
import { getRouteApi } from "@tanstack/react-router";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { fmtCurrency } from "@/lib/format";
import { useArchitectData } from "./data";
import { MenuMatrixChart } from "./MenuMatrixChart";
import { MenuItemsTable } from "./MenuItemsTable";
import { TopPerformersPanel } from "./TopPerformersPanel";
import { CLASS_COLOR } from "./utils";

const layoutApi = getRouteApi("/_authenticated");

export function ArchitectPage() {
  const search = layoutApi.useSearch();
  const { items, totalRevenue, totalMargin, blendedPct, stars, dogs, medianSold, medianMargin } =
    useArchitectData(search);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Menu Revenue" value={fmtCurrency(totalRevenue)} hint={`${items.length} items`} tooltip="Total revenue attributed to menu items in this period." />
        <KpiTile label="Total Margin" value={fmtCurrency(totalMargin)} hint={`${blendedPct.toFixed(1)}% blended`} variant="success" tooltip="Contribution margin: revenue minus food cost across all items." />
        <KpiTile label="Stars" value={String(stars)} hint="High pop · high margin" variant="success" tooltip="High-popularity, high-margin items — protect and feature these." />
        <KpiTile label="Dogs" value={String(dogs)} hint="Consider removing" variant={dogs > 2 ? "warning" : "default"} tooltip="Low-popularity, low-margin items — candidates for removal." />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Menu Engineering Matrix" subtitle="Volume Sold vs Margin ($)" className="lg:col-span-3">
          <MenuMatrixChart items={items} medianSold={medianSold} medianMargin={medianMargin} />
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {(["Star", "Plowhorse", "Puzzle", "Dog"] as const).map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CLASS_COLOR[c] }} />
                {c}
              </span>
            ))}
          </div>
          <MenuItemsTable items={items} />
        </Panel>

        <Panel title="Top Performers" subtitle="By contribution margin" className="lg:col-span-2">
          <TopPerformersPanel items={items} />
        </Panel>
      </div>
    </div>
  );
}
