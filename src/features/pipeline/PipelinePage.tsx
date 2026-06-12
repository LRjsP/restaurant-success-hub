/**
 * The Pipeline — events & catering CRM.
 */
import { getRouteApi } from "@tanstack/react-router";
import { KpiTile, Panel } from "@/components/dashboard/KpiTile";
import { fmtCurrency, fmtNumber } from "@/lib/format";
import { usePipelineData } from "./data";
import { FunnelPanel } from "./FunnelPanel";
import { UpcomingEventsTable } from "./UpcomingEventsTable";

const layoutApi = getRouteApi("/_authenticated");

export function PipelinePage() {
  const search = layoutApi.useSearch();
  const { totalPipeline, confirmedValue, winRate, upcomingGuests, byStage, maxStageValue, upcoming, span, activeCount } =
    usePipelineData(search);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Open Pipeline" value={fmtCurrency(totalPipeline)} hint={`${activeCount} active`} tooltip="Combined potential revenue of every event still in play." />
        <KpiTile label="Confirmed" value={fmtCurrency(confirmedValue)} variant="success" hint="Booked + deposit" tooltip="Revenue from Confirmed or Deposit-Paid events." />
        <KpiTile label="Win Rate" value={`${winRate.toFixed(1)}%`} hint="Deposit paid / all" tooltip="Share of all leads that converted to a paid deposit." />
        <KpiTile label="Upcoming Guests" value={fmtNumber(upcomingGuests)} hint={`Next ${span} days`} tooltip="Total guests across in-horizon events." />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Funnel" subtitle="Pipeline by stage" className="lg:col-span-2">
          <FunnelPanel rows={byStage} maxValue={maxStageValue} />
        </Panel>
        <Panel title="Upcoming Events" subtitle="Sorted by date" className="lg:col-span-3">
          <UpcomingEventsTable events={upcoming} />
        </Panel>
      </div>
    </div>
  );
}
