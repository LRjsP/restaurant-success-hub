import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fmtCurrency } from "@/lib/format";

export function RevenueVsCostChart({ data }: { data: any[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color: "var(--color-foreground)" }}
            formatter={(value: number) => fmtCurrency(value)}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} />
          <Bar dataKey="value" name="Revenue" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="cogs" name="COGS" fill="var(--color-chart-4)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="labor" name="Labor" fill="var(--color-chart-3)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
