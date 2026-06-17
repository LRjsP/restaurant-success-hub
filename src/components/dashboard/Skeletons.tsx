import { Shimmer } from "./PageSkeleton";

export function KpiTileSkeleton() {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <Shimmer className="h-3 w-20" />
      <Shimmer className="mt-4 h-8 w-32" />
      <Shimmer className="mt-4 h-3 w-24" />
    </div>
  );
}

const GRID_COLS: Record<number, string> = {
  3: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5",
};

export function KpiRowSkeleton({ count = 4 }: { count?: 3 | 4 | 5 }) {
  return (
    <div className={GRID_COLS[count] ?? GRID_COLS[4]}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiTileSkeleton key={i} />
      ))}
    </div>
  );
}

const BAR_HEIGHTS = [40, 65, 50, 80, 35, 70, 55, 90, 45, 60, 75, 50, 85, 40, 65, 55, 70, 45];

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`w-full ${height} flex items-end gap-1.5 p-2`}>
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-sm bg-muted/40"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((__, c) => (
            <Shimmer key={c} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HeatmapSkeleton() {
  return <Shimmer className="h-56 w-full" />;
}
