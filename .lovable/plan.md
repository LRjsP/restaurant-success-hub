## What we're building

A restaurant operator's KPI dashboard for a single location, structured as four tabbed views ("The Floor", "The Office", "The Architect", "The Pipeline") with a persistent global filter bar. I'll use the aesthetic, luxury, easy-to-read, **Terminal Command** design direction — dark operator-grade UI, JetBrains Mono numerics, amber accent, dense information layout. It best matches the "reading the line on a busy Friday" sensibility.

Backed by **Lovable Cloud** (Supabase under the hood). Your $25/month free Cloud balance covers this comfortably — no extra subscription cost.

## Scope

### Tab 1 — The Floor (daily pulse)

- Hero KPI tiles: Net Sales, Covers, PPA, Average Check, Table Turnover, Discounts %
- Each tile shows current value + delta vs previous period + sparkline
- Alert list: void/comp anomalies, overtime warnings
- Live cover count indicator

### Tab 2 — The Office (weekly P&L)

- Big numbers: Prime Cost %, Food Cost %, Pour Cost %, Labor Cost %, SPLH
- Each with target band (e.g. Prime Cost target 55–60%, color-coded)
- Line chart: Sales vs Labor Hours over the week
- Breakdown table: cost categories with variance

### Tab 3 — The Architect (yield & menu)

- RevPASH heatmap (hour × day) — visually surfaces dead zones
- RevPATI + Seat Occupancy summary cards
- Menu Engineering quadrant chart (Stars / Plowhorses / Puzzles / Dogs)
- "Menu Dogs to Remove" table — bottom 5 by margin × volume

### Tab 4 — The Pipeline (CRM, events, digital)

- Funnel chart: Inquiries → Proposals → Contracts → Deposits
- Pipeline value ($) and Event AOV cards
- VIP At-Risk table (RFM-derived): Name | LTV | Days since last visit | Action button
- Digital activity line chart: MAU vs Online Orders
- No-show rate + Cart abandonment cards

### Global filter bar (top, persistent across tabs)

- Date range presets (Today / Week / Month / YTD / Custom)
- Compare-to-previous-period toggle
- Revenue center dropdown (Dining Room / Bar / Patio / Takeout / Delivery / Catering)

## How it works (technical section)

**Stack:** TanStack Start + Tailwind + shadcn/ui + Recharts. Lovable Cloud (Supabase) for data + auth.

**Auth:** Email/password login, single owner account. Protected `/_authenticated/*` routes — dashboard sits behind the gate.

**Database schema (Postgres via Lovable Cloud):**

```text
restaurants       (id, name, seats, hours_open)
revenue_centers   (id, restaurant_id, name)
orders            (id, restaurant_id, center_id, opened_at, closed_at,
                   covers, net_sales, gross_sales, discounts, comps,
                   table_id, server_id)
order_items       (id, order_id, menu_item_id, qty, price, plate_cost)
menu_items        (id, name, category, price, plate_cost, is_active)
labor_shifts      (id, restaurant_id, staff_id, clock_in, clock_out, wage)
reservations      (id, restaurant_id, party_size, reserved_at,
                   status: booked|seated|no_show|cancelled)
guests            (id, name, email, lifetime_value, last_visit_at, tier)
events_pipeline   (id, contact_name, company, stage: inquiry|proposal|
                   contract|deposit|won|lost, value, created_at)
digital_activity  (id, date, mau, online_orders, cart_starts, cart_completed)
```

All tables: RLS enabled, scoped to authenticated owner. KPI math happens in TanStack server functions (`createServerFn`) that aggregate from these tables — no client-side service-role access.

**Seed data:** 90 days of realistic demo data (orders, shifts, reservations, guests, events) so every chart is populated on first login. A reset-seed server function lets you re-seed anytime.

**KPI calc layer:** One server function per tab returns the full payload (KPIs + chart data) for the active date range + center filter. Filters live in URL search params (zod-validated) so views are shareable/bookmarkable.

**Components:** KPI tile, sparkline, delta badge, heatmap grid, funnel bars, quadrant scatter, data table with action buttons.

## Out of scope

- Multi-location switcher (single restaurant per your answer)
- POS/Toast/Resy integrations (demo data only; real integrations later)
- Email automation for "Send Promo" action buttons (button stub for now)
- Mobile-first layout (desktop-optimized; responsive but operator workflow is desktop)

## Build order

1. Enable Lovable Cloud, create schema + RLS + seed function
2. Auth (email/password) + protected layout
3. Global filter bar + tab nav shell with chosen design tokens
4. Tab 1 (Floor) end-to-end as the pattern
5. Tabs 2, 3, 4 in parallel using the same KPI-fn pattern
6. Polish: empty states, loading skeletons, delta colorways