# Plan — Refine the Menu Engineering Matrix

Scope is strictly limited to the scatter chart block inside
`src/routes/_authenticated.architect.tsx`. No other files are touched
(per the CRITICAL RULE: `dashboard-search.ts`, `_authenticated.tsx`, and
global routing remain untouched).

## Audit summary

- X-axis already represents Volume Sold (`dataKey="sold"`) — keep, relabel to "Volume Sold".
- Y-axis currently plots `marginPct` formatted as `%` — change to absolute Margin ($) using `dataKey="margin"`.
- No `ReferenceLine`s exist — add two (median X, median Y) to form four quadrants.
- No background quadrant labels — add absolute-positioned, low-opacity "Stars / Plowhorses / Puzzles / Dogs" text inside the chart container.

## Changes (single file: `src/routes/_authenticated.architect.tsx`)

1. **Import additions** (from `recharts`): add `ReferenceLine`.
2. **Compute medians** just above the JSX:
   - `medianSold` = median of `items.map(i => i.sold)`
   - `medianMargin` = median of `items.map(i => i.margin)`
   (Median, not mean — robust to outliers and matches classic menu-engineering convention.)
3. **Y-axis swap**:
   - `dataKey="margin"`, `name="Margin ($)"`
   - `tickFormatter` → `fmtCurrency` (compact, e.g. `$1.2k`)
   - Axis label "Margin ($)" on the left.
4. **Add two `ReferenceLine`s**:
   - Horizontal at `y={medianMargin}`, stroke `var(--color-border)`, `strokeDasharray="4 4"`.
   - Vertical at `x={medianSold}`, same styling.
5. **Quadrant background labels** (absolute-positioned inside the chart's relative wrapper, behind the `ResponsiveContainer` via `z-0` / `pointer-events-none`):
   - Top-left: **Puzzles** (low volume, high margin)
   - Top-right: **Stars** (high volume, high margin)
   - Bottom-left: **Dogs** (low volume, low margin)
   - Bottom-right: **Plowhorses** (high volume, low margin)
   - Styling: `font-mono uppercase tracking-widest text-[11px] text-muted-foreground/30` (very low opacity so points read clearly).
6. **Tooltip formatter**: update the Margin branch to format with `fmtCurrency` and label "Margin ($)". Keep "Units sold" and revenue branches as-is.
7. **Legend row**: keep the existing Star/Plowhorse/Puzzle/Dog color chips below the chart — they now reinforce the quadrant overlay.

## What stays the same

- Point coloring by `classification` via `CLASS_COLOR`.
- Bubble sizing via `ZAxis` on `revenue`.
- "Top Performers" side panel.
- KPI tiles above the chart.
- Chart grid color (`var(--color-border)`), transparent background, font tokens.

## Out of scope (per CRITICAL RULE)

- No changes to `_authenticated.tsx`, `dashboard-search.ts`, routing, auth flow, `PendingComponent`s, empty/error states, or other route files.
- No edits to `demo-data.ts` — `MenuItem.margin` already exists, so the Y-axis swap is a pure read change.

## Verification after build

- Chart renders 4 visually distinct quadrants split by dashed median lines.
- Background labels are present but recede behind data points.
- Hover tooltip shows "Margin ($)" formatted as currency.
- No regressions in light/dark mode (only token-based colors used).
