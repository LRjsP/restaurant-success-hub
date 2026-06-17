## New Tab: "The Service"

A cashier/waiter-facing order entry screen that writes into the same tables the dashboards already read from, so every submitted order immediately flows into Floor / Office / Architect KPIs.

### Navigation
- New route `src/routes/_authenticated.service.tsx` mounted at `/service`.
- Add a fifth tab in `DashboardShell` (`TABS` array): label "The Service", hint "Order Entry", with a matching background asset.
- Tab ordering: Service first (operational entry), then Floor / Office / Architect / Pipeline (analytics).

### Order Entry UI
Single-page form, full width inside the dashboard shell:

1. **Service context** (top bar)
   - Date (defaults today, editable for back-entry)
   - Hour (defaults current hour, editable)
   - Revenue center select — sourced from `restaurant_settings.revenue_centers` (Main Dining Room, Bar, Patio, Takeout, Delivery, Catering)
   - Party size / covers (number)
   - Table # (optional text, only counted toward `tables_served` when filled)
   - Server name (optional, free text)

2. **Items panel** (left, ~60%)
   - Category tabs: Starters, Mains, Pastas, Pizzas, Sides, Desserts, Cocktails (pulled live from `menu_items` where `is_active = true`)
   - Item cards show name + price; click adds to cart, click again increments qty
   - Search box to filter items

3. **Cart / ticket panel** (right, ~40%)
   - Line items with qty +/-, unit price, line total, remove
   - Subtotal (gross_sales)
   - Discount input ($ or %)
   - Comp toggle per line (full comp moves amount into `comps`)
   - Computed net_sales = gross − discounts − comps
   - Estimated food cost from each item's `plate_cost × qty`
   - Channel auto-derived from revenue center (Dine-in vs Takeout vs Delivery vs Catering)
   - Guest lookup (optional): search `guests` by name/email or "+ New guest"; updates `visit_count`, `last_visit_at`, `lifetime_value`
   - **Submit Order** button

4. **Recent orders today** (collapsible below cart)
   - Last 10 orders submitted today by this user, with a Void action that reverses the deltas.

### Data writes (single server fn, transactional)
`createServerFn` `submitOrder` with `requireSupabaseAuth`, inserts/upserts:

- **`menu_item_daily_sales`** — one upsert per line, key `(menu_item_id, date, revenue_center)`, incrementing `units_sold`, `revenue`, `cost`.
- **`daily_metrics`** — upsert key `(date, revenue_center)`, incrementing:
  - `covers` += party_size
  - `tables_served` += 1 if table # provided
  - `gross_sales` += subtotal
  - `discounts` += discount
  - `comps` += comp total
  - `net_sales` += net
  - `food_sales` / `beverage_sales` / `liquor_sales` / `beer_sales` / `wine_sales` += per category split (Cocktails → liquor; future-proof beer/wine if added; everything else → food)
  - `food_cost` / `beverage_cost` += plate_cost split
- **`hourly_metrics`** — upsert key `(date, hour, revenue_center)`, increment `revenue` and `covers`.
- **`guests`** — if a guest is attached: increment `visit_count`, set `last_visit_at = now()`, `lifetime_value += net`. Re-evaluate `tier` (e.g. ≥ $2k VIP, ≥ $500 Regular, else New) — matching whatever rule the rest of the app already uses; I'll mirror that during implementation.
- **`audit_log`** — record the order payload for traceability and to support Void.

Void: re-run the same server fn with negative deltas and mark the audit entry voided.

### Validation
Zod schema on both client and server: positive qty, party_size ≥ 1, discount ≤ subtotal, at least one line item, date not in the future beyond today, hour 0–23, revenue_center ∈ settings list.

### Technical notes
- Files: `src/routes/_authenticated.service.tsx`, `src/components/service/{OrderForm,ItemsGrid,CartPanel,GuestPicker,RecentOrders}.tsx`, `src/lib/service.functions.ts`, `src/lib/service-schema.ts`.
- All increments done in SQL via a Postgres function `apply_order_deltas(payload jsonb)` called by the server fn, so concurrent cashiers don't clobber each other (read-modify-write race). Migration adds that function plus the audit row shape if not already covered.
- New background asset for the Service tab generated to match the existing Floor/Office style.
- No changes to existing dashboard reads — they pick up the new rows automatically.

### Out of scope (will confirm before adding)
- Printing receipts / KDS routing
- Payment capture (cash/card split)
- Tip handling
- Modifiers / special instructions per line
- Multi-seat ticket splitting

If you want any of those in v1, say which and I'll fold them in.