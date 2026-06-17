import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-muted/40",
        className,
      )}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Shimmer className="h-72 lg:col-span-3" />
        <Shimmer className="h-72 lg:col-span-2" />
      </div>
      <Shimmer className="h-64" />
    </div>
  );
}
