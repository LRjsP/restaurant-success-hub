import { AlertTriangle, RotateCw } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "We couldn't reach the database",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="flex-1 space-y-2">
          <h3 className="font-mono text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {message ??
              "The request didn't complete. Check your connection and try again."}
          </p>
          {onRetry && (
            <Button type="button" size="sm" variant="outline" onClick={onRetry} className="mt-2 gap-1.5">
              <RotateCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Default errorComponent for routes — retries via router + query invalidation. */
export function RouteErrorBoundary({ error }: { error: Error }) {
  const router = useRouter();
  const qc = useQueryClient();
  const retry = () => {
    qc.invalidateQueries();
    router.invalidate();
  };
  return (
    <div className="p-6">
      <ErrorState message={error?.message ?? "An unexpected error occurred."} onRetry={retry} />
    </div>
  );
}
