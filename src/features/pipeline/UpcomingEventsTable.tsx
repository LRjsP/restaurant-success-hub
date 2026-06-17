import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { fmtCurrency } from "@/lib/format";
import type { PipelineEvent } from "@/lib/dashboard-types";
import { STAGE_COLOR } from "./data";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/Skeletons";

export function UpcomingEventsTable({
  events,
  isLoading,
}: {
  events: PipelineEvent[];
  isLoading?: boolean;
}) {
  if (isLoading) return <TableRowsSkeleton rows={5} cols={6} />;
  if (!events.length) {
    return (
      <EmptyState
        icon={CalendarPlus}
        message="No upcoming events in this range."
        ctaLabel="Add event"
        onCta={() => toast.info("Event creation is coming soon.")}
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-3 font-normal">Date</th>
            <th className="py-2 pr-3 font-normal">Client</th>
            <th className="py-2 pr-3 font-normal">Type</th>
            <th className="py-2 pr-3 text-right font-normal">Guests</th>
            <th className="py-2 pr-3 text-right font-normal">Value</th>
            <th className="py-2 text-right font-normal">Stage</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{e.date}</td>
              <td className="py-2.5 pr-3 text-foreground">{e.client}</td>
              <td className="py-2.5 pr-3 text-xs text-muted-foreground">{e.type}</td>
              <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{e.guests}</td>
              <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-foreground">{fmtCurrency(e.value)}</td>
              <td className="py-2.5 text-right">
                <span
                  className={cn("inline-block rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider")}
                  style={{ backgroundColor: `color-mix(in oklab, ${STAGE_COLOR[e.stage]} 18%, transparent)`, color: STAGE_COLOR[e.stage] }}
                >
                  {e.stage}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
