# MISE.OPS

A restaurant operations intelligence dashboard for independent operators, chefs, and general managers who need to see their business clearly — from the dining room floor to the back-office P&L.

---

## Hypothesis

> **Independent restaurant operators don't lack data — they lack a single, opinionated view of it.**

Most operators stitch their decisions together from a POS report, a spreadsheet from their bookkeeper, a Google Calendar of private events, and gut feel. The hypothesis behind MISE.OPS is that operators will make faster, better decisions if they can see the **four lenses that actually drive a restaurant** — service, profit, menu, and pipeline — in one tool, with consistent filters, period comparisons, and plain-language explanations of every metric.

If that hypothesis is correct, an operator should be able to answer questions like *"Are we losing money on Tuesdays?"*, *"Which menu items deserve a price bump?"*, or *"How healthy is our catering pipeline this quarter?"* in under 30 seconds.

---

## Scenario

The product is positioned around a recurring scenario:

> It's Monday morning. A GM/owner sits down with a coffee before the team arrives. They have 15 minutes to understand what happened last week, decide what to change this week, and confirm that the upcoming catering pipeline is healthy.

Every design decision — the four-tab layout, the persistent date range and revenue-center filters, the period-over-period toggle, the heatmaps, the menu-engineering quadrant — is optimised for **that 15-minute Monday review**.

---

## Key Screens

| Screen | Route | What it answers |
|---|---|---|
| **The Floor** | `/floor` | How is service performing? Covers, net sales, PPA, avg check, discount rate, and a day × time demand heatmap. |
| **The Office** | `/office` | Are we making money? Weekly P&L with labor %, COGS %, operating profit, and revenue-vs-cost breakdowns. |
| **The Architect** | `/architect` | Which menu items earn their place? Popularity × margin scatter, with Stars / Plowhorses / Puzzles / Dogs classification. |
| **The Pipeline** | `/pipeline` | What's coming? Events & catering CRM — open pipeline value, win rate, upcoming events, stage funnel. |
| **Auth** | `/auth` | Email/password + Google sign-in. Redirects authenticated users into the dashboard. |

All four dashboard screens share the same shell: header with live-service indicator, tab navigation with atmospheric backgrounds, and a filter bar (date range, revenue center, compare toggle).

---

## User Flow

```text
        ┌──────────────┐
        │   Landing    │  /  → redirects to /floor (or /auth if signed out)
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │   /auth      │  Email + password, Google OAuth
        └──────┬───────┘
               │ on success
        ┌──────▼─────────────────────────────────────────────┐
        │              Dashboard Shell                       │
        │  Header · Tabs · Date range · Center · Compare     │
        ├────────────┬────────────┬────────────┬─────────────┤
        │  /floor    │  /office   │ /architect │  /pipeline  │
        │  Service   │   P&L      │   Menu     │   Events    │
        └────────────┴────────────┴────────────┴─────────────┘
```

**Typical session:**

1. User lands on `/` → redirected to `/floor` if authenticated, otherwise `/auth`.
2. Signs in via Supabase (email or Google).
3. Lands on **The Floor**, scans yesterday's covers and net sales, checks the heatmap for soft dayparts.
4. Switches to **The Office** to confirm labor % and COGS % are within target.
5. Opens **The Architect** to identify a Plowhorse worth a small price test.
6. Finishes on **The Pipeline** to confirm next week's events are confirmed and follow up on at-risk leads.
7. Adjusts date range / revenue center / compare-to-prior-period without losing context — all filters are URL-driven, so any view is shareable.

---

## Build Decisions

### Framework — TanStack Start
Chosen for **file-based routing with typed search params, first-class SSR, and a clean loader/Query integration**. The dashboard relies heavily on URL state (range, center, compare), and TanStack Router's Zod-validated search params make that ergonomic and type-safe.

### URL as state container
Filters live in the URL via a shared Zod schema (`src/lib/dashboard-search.ts`). This makes every view shareable, bookmarkable, and SSR-friendly — and it matches the "Monday review" scenario where an operator may forward a link to a chef or partner.

### Four routes, one shell
Rather than a single mega-dashboard, each lens is its own route under the `_authenticated` layout. This keeps each screen focused, code-split, and easy to extend, while the shared `DashboardShell` guarantees identical filter behaviour and visual rhythm across tabs.

### Demo data first
`src/lib/demo-data.ts` generates deterministic, realistic restaurant metrics keyed off the active range and revenue center. This lets the product be evaluated end-to-end without a POS integration and serves as the contract a real data source must satisfy later.

### Atmospheric backgrounds per tab
Each tab carries a subtle background image (floor / office / architect / pipeline) to reinforce *where you are* without adding chrome. Contrast is managed through a tuned overlay so KPI tiles remain legible in both themes.

### Design tokens, not hardcoded colors
All colors, surfaces, and opacities are semantic CSS variables in `src/styles.css`. Components use tokens (`bg-card`, `text-muted-foreground`, etc.), so dark/light mode and future rebrands are a token change, not a sweep.

### Auth via Supabase, gated by a layout route
The `_authenticated` pathless layout wraps every dashboard route and redirects unauthenticated users to `/auth`. Loaders behind this gate can safely call protected server functions because the session is guaranteed.

### shadcn/ui + Recharts
shadcn/ui gives accessible Radix primitives we own outright (no version lock-in), and Recharts handles the bar/line/scatter/heatmap variety the four lenses need without pulling in a heavier visualization stack.

### TanStack Query for reads
Initial reads use `ensureQueryData` in the loader + `useSuspenseQuery` in the component. No `useEffect` + `fetch`, no `isLoading` flicker on first render.

---

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR)
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 with CSS theme variables
- **Components:** shadcn/ui (Radix UI primitives)
- **Charts:** Recharts
- **Data:** TanStack Query
- **Auth & Backend:** Supabase (Postgres + RLS, email + Google OAuth)
- **Validation:** Zod
- **Fonts:** Inter (UI), JetBrains Mono (numerics)

---

## Project Structure

```text
src/
  routes/
    __root.tsx                    # Root shell, providers, meta
    index.tsx                     # Redirects to /floor
    auth.tsx                      # Sign in / sign up
    _authenticated.tsx            # Auth gate + dashboard layout
    _authenticated.floor.tsx      # The Floor
    _authenticated.office.tsx     # The Office
    _authenticated.architect.tsx  # The Architect
    _authenticated.pipeline.tsx   # The Pipeline
  components/
    dashboard/
      DashboardShell.tsx          # Header, tabs, filter bar, backgrounds
      KpiTile.tsx                 # KPI card + Panel wrappers
      Heatmap.tsx                 # Day × time demand heatmap
    ui/                           # shadcn/ui primitives
    theme-provider.tsx
    theme-toggle.tsx
  lib/
    demo-data.ts                  # Synthetic data generators
    format.ts                     # Currency / number / date helpers
    dashboard-search.ts           # Zod schema for URL search params
  integrations/supabase/          # Client + auth middleware
  assets/                         # Per-tab background images
  styles.css                      # Tailwind + theme tokens
```

---

## Getting Started

### Prerequisites
- Node.js 20+ (or Bun)
- A Supabase project for auth

### Install

```bash
git clone <repo-url>
cd mise-ops
bun install   # or: npm install
```

### Environment

Create a `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Never expose the Supabase service-role key in client bundles.

### Develop

```bash
bun run dev    # http://localhost:3000
```

### Build

```bash
bun run build  # SSR-ready production bundle
```

---

## Connecting Real Data

Replace the generators in `src/lib/demo-data.ts` with:

- **POS APIs** — Square, Toast, Clover for covers / sales / item mix
- **Accounting** — QuickBooks or Xero for labor and COGS
- **Direct reads** — Supabase server functions over your own schema

Each lens (`/floor`, `/office`, `/architect`, `/pipeline`) reads from a small, well-defined surface — swap the generator for a real fetch and the UI keeps working.

---

## Pushing to GitHub

This project syncs bidirectionally with GitHub via the Lovable GitHub integration. To connect and push:

1. In the Lovable editor, open the **+** menu (bottom-left of the chat input) → **GitHub → Connect project**.
2. Authorize the Lovable GitHub App and pick the account/org for the repo.
3. Click **Create Repository** — Lovable creates the repo and pushes the current codebase, including this README.

After the first push, every change you make in Lovable (this README included) is committed and pushed to GitHub automatically.

---

## License

MIT
