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

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiTileSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`w-full ${height} flex items-end gap-1.5 p-2`}>
      {Array.from({ length: 18 }).map((_, i) => (
        <Shimmer
          key={i}
          className="flex-1"
          /* random-ish heights via inline style for variety */
          // @ts-ignore
          style={{ height: `${30 + ((i * 17) % 65)}%` }}
        />
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
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
