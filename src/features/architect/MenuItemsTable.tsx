import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtCurrency, fmtNumber } from "@/lib/format";
import type { MenuItem } from "@/lib/dashboard-types";
import { CLASS_COLOR, type SortKey } from "./utils";

const SORT_FIELDS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "sold", label: "Sold" },
  { key: "marginPct", label: "Margin %" },
  { key: "margin", label: "Margin $" },
  { key: "revenue", label: "Revenue" },
];

export function MenuItemsTable({ items }: { items: MenuItem[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("margin");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const groups = (["Star", "Plowhorse", "Puzzle", "Dog"] as const).map((cls) => {
    const group = items
      .filter((i) => i.classification === cls)
      .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "name") return dir * a.name.localeCompare(b.name);
        if (sortKey === "sold") return dir * (a.sold - b.sold);
        if (sortKey === "margin") return dir * (a.margin - b.margin);
        if (sortKey === "marginPct") return dir * (a.marginPct - b.marginPct);
        if (sortKey === "revenue") return dir * (a.revenue - b.revenue);
        return 0;
      });
    return { cls, group };
  });
  const totalFiltered = groups.reduce((sum, g) => sum + g.group.length, 0);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items..."
            className="h-8 rounded-md border-border bg-transparent pl-8 pr-3 py-1 text-xs font-mono shadow-none placeholder:font-mono placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sort by</span>
          {SORT_FIELDS.map(({ key, label }) => {
            const active = sortKey === key;
            const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
            return (
              <button
                key={key}
                onClick={() => {
                  if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortKey(key);
                    setSortDir(key === "name" ? "asc" : "desc");
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {totalFiltered === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-mono text-sm text-muted-foreground">No items found</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">Try adjusting your search</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map(({ cls, group }) => (
            <div key={cls}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CLASS_COLOR[cls] }} />
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">{cls}s</h4>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {group.length} item{group.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-[32%] pb-1.5 pr-4 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Item</th>
                      <th className="w-[14%] pb-1.5 pr-4 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Category</th>
                      <th className="w-[12%] pb-1.5 pr-4 text-right font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Sold</th>
                      <th className="w-[14%] pb-1.5 pr-4 text-right font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Margin %</th>
                      <th className="w-[14%] pb-1.5 pr-4 text-right font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Margin</th>
                      <th className="w-[14%] pb-1.5 text-right font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {group.length > 0 ? (
                      group.map((i) => (
                        <tr key={i.name}>
                          <td className="py-1.5 pr-4 text-sm text-foreground">{i.name}</td>
                          <td className="py-1.5 pr-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{i.category}</td>
                          <td className="py-1.5 pr-4 text-right font-mono text-sm tabular-nums text-foreground">{fmtNumber(i.sold)}</td>
                          <td className="py-1.5 pr-4 text-right font-mono text-sm tabular-nums text-foreground">{i.marginPct.toFixed(1)}%</td>
                          <td className="py-1.5 pr-4 text-right font-mono text-sm tabular-nums text-foreground">{fmtCurrency(i.margin)}</td>
                          <td className="py-1.5 text-right font-mono text-sm tabular-nums text-foreground">{fmtCurrency(i.revenue)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center font-mono text-[11px] text-muted-foreground/60">No matching items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
