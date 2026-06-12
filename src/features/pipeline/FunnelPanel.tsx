import { fmtCurrency } from "@/lib/format";
import type { PipelineEvent } from "@/lib/demo-data";
import { STAGE_COLOR } from "./data";

type StageRow = { stage: PipelineEvent["stage"]; count: number; value: number };

export function FunnelPanel({ rows, maxValue }: { rows: StageRow[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {rows.map((s) => (
        <div key={s.stage}>
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-2 text-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[s.stage] }} />
              {s.stage}
            </span>
            <span className="text-muted-foreground">{s.count} · {fmtCurrency(s.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-muted">
            <div className="h-full" style={{ width: `${(s.value / maxValue) * 100}%`, backgroundColor: STAGE_COLOR[s.stage] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
