import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  ReferenceLine,
} from "recharts";
import { fmtCurrency, fmtNumber } from "@/lib/format";
import type { MenuItem } from "@/lib/demo-data";
import { CLASS_COLOR } from "./utils";

export function MenuMatrixChart({
  items,
  medianSold,
  medianMargin,
}: {
  items: MenuItem[];
  medianSold: number;
  medianMargin: number;
}) {
  return (
    <div className="relative h-80 w-full">
      <div className="pointer-events-none absolute inset-0 z-0">
        <span className="absolute left-[8%] top-[8%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">Puzzles</span>
        <span className="absolute right-[6%] top-[8%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">Stars</span>
        <span className="absolute left-[8%] bottom-[14%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">Dogs</span>
        <span className="absolute right-[6%] bottom-[14%] font-mono text-[11px] uppercase tracking-widest text-muted-foreground/25">Plowhorses</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            type="number"
            dataKey="sold"
            name="Volume Sold"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Volume Sold (units)", position: "insideBottom", offset: -8, fontSize: 10, fill: "var(--color-muted-foreground)" }}
          />
          <YAxis
            type="number"
            dataKey="margin"
            name="Margin ($)"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`)}
          />
          <ZAxis type="number" dataKey="revenue" range={[60, 400]} />
          <ReferenceLine y={medianMargin} stroke="var(--color-border)" strokeDasharray="4 4" ifOverflow="extendDomain" />
          <ReferenceLine x={medianSold} stroke="var(--color-border)" strokeDasharray="4 4" ifOverflow="extendDomain" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: "var(--color-foreground)" }}
            formatter={(value: any, name: string) => {
              if (name === "Margin ($)") return [fmtCurrency(Number(value)), name];
              if (name === "Volume Sold") return [fmtNumber(value), name];
              return [fmtCurrency(value), name];
            }}
            labelFormatter={(_, payload: any) => payload?.[0]?.payload?.name ?? ""}
          />
          <Scatter data={items}>
            {items.map((i, idx) => (
              <Cell key={idx} fill={CLASS_COLOR[i.classification]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
