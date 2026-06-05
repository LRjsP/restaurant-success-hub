import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import {
  generatePipeline,
  daysForPreset,
  type PipelineEvent,
} from "@/lib/demo-data";
import { fmtCurrency, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const layoutApi = getRouteApi("/_authenticated");

const STAGES: PipelineEvent["stage"][] = ["Inquiry", "Proposal", "Confirmed", "Deposit Paid", "Lost"];

const STAGE_COLOR: Record<PipelineEvent["stage"], string> = {
  Inquiry: "var(--color-muted-foreground)",
  Proposal: "var(--color-chart-3)",
  Confirmed: "var(--color-chart-1)",
  "Deposit Paid": "var(--color-success)",
  Lost: "var(--color-destructive)",
};

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const search = layoutApi.useSearch();
  const events = generatePipeline(search.range);
  const span = daysForPreset(search.range);

  // Keep events within the active horizon for KPI math
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const horizonEnd = new Date(today);
  horizonEnd.setUTCDate(horizonEnd.getUTCDate() + span);

  const inHorizon = events.filter((e) => new Date(e.date) >= today && new Date(e.date) <= horizonEnd);

  const totalPipeline = events.filter((e) => e.stage !== "Lost").reduce((a, e) => a + e.value, 0);
  const confirmedValue = events.filter((e) => e.stage === "Confirmed" || e.stage === "Deposit Paid").reduce((a, e) => a + e.value, 0);
  const winRate = events.length ? (events.filter((e) => e.stage === "Deposit Paid").length / events.length) * 100 : 0;
  const upcomingGuests = inHorizon.reduce((a, e) => a + e.guests, 0);

  const byStage = STAGES.map((s) => ({
    stage: s,
    count: events.filter((e) => e.stage === s).length,
    value: events.filter((e) => e.stage === s).reduce((a, e) => a + e.value, 0),
  }));
  const maxStageValue = Math.max(...byStage.map((s) => s.value), 1);

  const upcoming = events
    .filter((e) => e.stage !== "Lost")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Open Pipeline"
          value={fmtCurrency(totalPipeline)}
          hint={`${events.filter((e) => e.stage !== "Lost").length} active`}
          tooltip="Combined potential revenue of every event still in play (excludes Lost). Your forward-looking demand signal for private dining and catering."
        />
        <KpiTile
          label="Confirmed"
          value={fmtCurrency(confirmedValue)}
          variant="success"
          hint="Booked + deposit"
          tooltip="Revenue from events that are Confirmed or have a Deposit Paid. Treat this as near-cash — staff and inventory should be planned against it."
        />
        <KpiTile
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          hint="Deposit paid / all"
          tooltip="Share of all leads that converted to a paid deposit. Indicates the health of your inquiry-to-booking process. Below 20% usually means slow responses or weak proposals."
        />
        <KpiTile
          label="Upcoming Guests"
          value={fmtNumber(upcomingGuests)}
          hint={`Next ${span} days`}
          tooltip="Total guests across in-horizon events. Use this for prep, sourcing, and front-of-house staffing decisions for the period."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Funnel" subtitle="Pipeline by stage" className="lg:col-span-2">
          <div className="space-y-3">
            {byStage.map((s) => (
              <div key={s.stage}>
                <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[s.stage] }} />
                    {s.stage}
                  </span>
                  <span className="text-muted-foreground">{s.count} · {fmtCurrency(s.value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full"
                    style={{
                      width: `${(s.value / maxStageValue) * 100}%`,
                      backgroundColor: STAGE_COLOR[s.stage],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Upcoming Events" subtitle="Sorted by date" className="lg:col-span-3">
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
                {upcoming.map((e) => (
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
        </Panel>
      </div>
    </div>
  );
}
