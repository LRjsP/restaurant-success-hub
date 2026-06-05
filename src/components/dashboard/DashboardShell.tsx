import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DATE_PRESETS, REVENUE_CENTERS } from "@/lib/format";
import { type DashboardSearch } from "@/lib/dashboard-search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const TABS = [
  {
    to: "/floor",
    label: "The Floor",
    hint: "Daily Pulse",
    description: "Real-time service performance — covers, net sales, PPA, and day×time demand patterns.",
  },
  {
    to: "/office",
    label: "The Office",
    hint: "Weekly P&L",
    description: "Financial health — labor %, COGS %, prime cost, and weekly P&L summary.",
  },
  {
    to: "/architect",
    label: "The Architect",
    hint: "Yield & Menu",
    description: "Menu engineering — item-level margin, mix, and yield optimization.",
  },
  {
    to: "/pipeline",
    label: "The Pipeline",
    hint: "CRM & Events",
    description: "Events & catering CRM — leads, win rate, booked revenue, and pipeline value.",
  },
] as const;

export function DashboardShell({
  children,
  search,
}: {
  children: React.ReactNode;
  search: DashboardSearch;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const updateSearch = (patch: Partial<DashboardSearch>) => {
    navigate({ to: pathname, search: (prev: any) => ({ ...prev, ...patch }), replace: true });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent">
                <span className="font-mono text-[10px] font-bold text-accent-foreground">M</span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-tight">
                MISE<span className="text-muted-foreground">.OPS</span>
              </span>
            </div>
            <nav className="flex h-14 items-center gap-1">
              {TABS.map((t) => {
                const active = pathname === t.to;
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    search={(prev: any) => prev}
                    className={`group relative flex h-full items-center px-3 text-sm font-medium transition-colors ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-success)]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Live Service
              </span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between border-t border-border px-6 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mr-2">
              Range
            </span>
            <div className="flex rounded-sm border border-border bg-card p-0.5">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateSearch({ range: p.value })}
                  className={`px-3 py-1 font-mono text-[11px] uppercase tracking-wide rounded-sm transition-colors ${
                    search.range === p.value
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mx-3 h-5 w-px bg-border" />
            <Select value={search.center} onValueChange={(v) => updateSearch({ center: v })}>
              <SelectTrigger className="h-8 w-[180px] border-border bg-card text-xs font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_CENTERS.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs font-mono">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => updateSearch({ compare: !search.compare })}
              className={`ml-2 flex items-center gap-2 rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                search.compare
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${search.compare ? "bg-accent" : "bg-muted-foreground"}`} />
              Compare to Previous
            </button>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {TABS.find((t) => t.to === pathname)?.hint}
          </div>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
