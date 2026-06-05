# Plan: KPI Tooltips + Day × Time Heatmap

## 1. KPI info tooltips (all tabs)

Extend `KpiTile` (`src/components/dashboard/KpiTile.tsx`) with an optional `tooltip?: string` prop. When set, render a small `Info` icon (lucide, 12px, muted) next to the label, wrapped in shadcn `Tooltip` for an aesthetic, properly-sized hover popover (max-w ~260px, mono caption, subtle border).

Pass clear, plain-language descriptions on every KPI tile across:
- `_authenticated.floor.tsx` — Net Sales, Covers, PPA, Avg Check, Discount %
- `_authenticated.office.tsx` — Net Revenue, Labor %, COGS %, Operating Profit, Margin
- `_authenticated.architect.tsx` — Menu KPIs (Stars, Avg Margin, etc.)
- `_authenticated.pipeline.tsx` — Pipeline KPIs (Forecasted Revenue, Confirmed, Conversion, etc.)

Example copy: *"Per Person Average — total net sales divided by covers. Measures how much each guest spends on average."*

Ensure `TooltipProvider` is mounted (add at `__root.tsx` if not already).

## 2. Day × Time heatmap component

New file: `src/components/dashboard/Heatmap.tsx`
- 7 rows (Sun–Sat) × 14 columns (11am–12am hourly slots).
- Cells colored with `--color-chart-1` opacity scale (0.05 → 0.95) based on value.
- Header shows metric toggle (Covers / Net Sales) using shadcn `Tabs` or segmented buttons.
- Cell hover: small tooltip with day, time, exact value.
- Panel header includes the same info-icon tooltip: *"Operational heatmap — identifies your busiest day-parts so you can staff and prep accordingly."*

## 3. Demo data for heatmap

Add `generateHeatmap(center, days)` in `src/lib/demo-data.ts`. Deterministic seed per (day-of-week, hour, center). Returns `{ day, hour, covers, netSales }[]`. Respects current `center` filter; uses a realistic day-part curve (lunch bump 12–2pm, dinner peak 6–9pm, weekend amplification).

## 4. Placement

- **Floor tab**: full-width Panel below the Daily Trend / Alerts row.
- **Office tab**: full-width Panel after the P&L summary, framed as "Labor Demand by Day-Part" to tie into staffing/cost analysis.

## Technical notes

- No backend or schema changes — all client-side, theme-token driven (light + dark safe).
- Reuses existing `Panel` wrapper and design tokens; no hardcoded colors.
- Tooltip uses shadcn `@/components/ui/tooltip` (already installed).
- Heatmap is pure CSS grid — no extra chart library.
