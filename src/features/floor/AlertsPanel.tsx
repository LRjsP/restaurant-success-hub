import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Alert = { severity: "danger" | "warning" | "info"; message: string; time: string };

export function AlertsList({ alerts }: { alerts: readonly Alert[] }) {
  return (
    <div className="space-y-3">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={cn(
            "flex items-start gap-2.5 rounded-sm border-l-2 bg-card/50 px-3 py-2.5",
            a.severity === "danger" && "border-l-[var(--color-destructive)]",
            a.severity === "warning" && "border-l-[var(--color-warning)]",
            a.severity === "info" && "border-l-[var(--color-success)]",
          )}
        >
          {a.severity === "danger" && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-destructive)]" />}
          {a.severity === "warning" && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />}
          {a.severity === "info" && <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />}
          <div className="min-w-0">
            <p className="text-[11px] leading-snug text-foreground">{a.message}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{a.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
