import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Status = "ok" | "degraded" | "down";

export function ConnectionStatus() {
  const [status, setStatus] = useState<Status>("ok");
  const failuresRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const { error } = await supabase
          .from("restaurant_settings")
          .select("id", { head: true, count: "exact" });
        if (cancelled) return;
        if (error) throw error;
        failuresRef.current = 0;
        setStatus("ok");
      } catch {
        if (cancelled) return;
        failuresRef.current += 1;
        setStatus(failuresRef.current >= 2 ? "down" : "degraded");
      }
    };
    ping();
    const id = setInterval(ping, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const color =
    status === "ok"
      ? "bg-[var(--color-success)]"
      : status === "degraded"
      ? "bg-[var(--color-warning)]"
      : "bg-[var(--color-destructive)]";
  const label =
    status === "ok" ? "Connected" : status === "degraded" ? "Reconnecting…" : "Disconnected";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          aria-label={`Database ${label}`}
          className="flex h-7 items-center gap-1.5 rounded-sm border border-border bg-card px-2"
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", color, status !== "ok" && "animate-pulse")} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            DB
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
