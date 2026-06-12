import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtCurrency } from "@/lib/format";

export function SalesTrendChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--color-foreground)",
            }}
            formatter={(value: number) => [fmtCurrency(value), "Net Sales"]}
          />
          <Area type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#salesGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
