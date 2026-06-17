import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  // Default to true to avoid hydration mismatch and false positives in preview/iframe environments.
  // Only switch to offline when the browser actually fires the "offline" event.
  const [online, setOnline] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const up = () => {
      setOnline(true);
      router.invalidate();
      queryClient.invalidateQueries();
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [router, queryClient]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-[var(--color-destructive)]/40 bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <WifiOff className="h-4 w-4 text-[var(--color-destructive)]" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-foreground">You're offline</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Waiting for connection…
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (navigator.onLine) {
              setOnline(true);
              router.invalidate();
              queryClient.invalidateQueries();
            }
          }}
          className="ml-2 inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    </div>
  );
}
