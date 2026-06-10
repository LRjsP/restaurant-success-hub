# MISE.OPS

A restaurant operations intelligence dashboard built for independent operators, chefs, and general managers who need to see their business clearly — from the dining room floor to the back-office P&L.

## Overview

MISE.OPS surfaces the metrics that matter across four operational lenses:

| Section | Purpose |
|---------|---------|
| **The Floor** | Daily pulse — covers, net sales, PPA, average check, discount rate, and day×time demand heatmaps. |
| **The Office** | Weekly P&L — labor %, COGS %, operating profit, and revenue-vs-cost breakdowns. |
| **The Architect** | Menu engineering — item-level margin analysis, popularity vs. margin scatter plots, and Stars / Plowhorses / Puzzles / Dogs classification. |
| **The Pipeline** | Events & catering CRM — open pipeline value, win rate, upcoming events, and stage funnel. |

The app ships with realistic demo data so you can explore every view immediately without connecting a POS or accounting system.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (full-stack React 19, file-based routing, SSR/SSG)
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS v4 with CSS theme variables
- **Components:** shadcn/ui (Radix UI primitives + `class-variance-authority`)
- **Charts:** Recharts
- **Data Fetching:** TanStack Query
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Backend:** Supabase (PostgreSQL, RLS policies)
- **Validation:** Zod (search params, forms)
- **Fonts:** Inter (body), JetBrains Mono (data + labels)

## Project Structure

```text
src/
  routes/                    # TanStack file-based routes
    __root.tsx               # Root layout (shell + providers + meta)
    index.tsx                # Landing redirect → /floor
    auth.tsx                 # Auth gate (redirects authenticated users)
    _authenticated.tsx         # Layout wrapper for protected dashboard views
    _authenticated.floor.tsx      # The Floor — service analytics
    _authenticated.office.tsx     # The Office — P&L & costs
    _authenticated.architect.tsx  # The Architect — menu engineering
    _authenticated.pipeline.tsx   # The Pipeline — events CRM
  components/
    dashboard/
      DashboardShell.tsx     # Shared shell: header, tabs, filters, backgrounds
      KpiTile.tsx            # KPI cards + Panel wrappers
      Heatmap.tsx            # Day×Time demand heatmap
    ui/                      # shadcn/ui primitives (Button, Tooltip, Select, etc.)
    theme-provider.tsx       # Dark / light mode context
    theme-toggle.tsx         # Theme switcher
  lib/
    demo-data.ts             # Synthetic restaurant data generators
    format.ts                # Currency, number, and date formatting helpers
    dashboard-search.ts      # Zod schema for URL search params
  integrations/supabase/     # Supabase client + auth middleware
  assets/                    # Tab-specific atmospheric background images
  styles.css                 # Tailwind entry + CSS theme tokens
```

## Getting Started

### Prerequisites

- Node.js 20+ (or Bun)
- A Supabase project (for auth and optional data persistence)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mise-ops

# Install dependencies
bun install
# or
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> The Supabase service-role key is server-only and should **never** be exposed in client bundles.

### Development

```bash
bun run dev
```

The dev server starts at `http://localhost:3000`.

### Build

```bash
bun run build
```

Produces an optimized production bundle with SSR.

## Features

- **Four operational views** tailored to restaurant workflows
- **Atmospheric tab backgrounds** that subtly shift based on the active section
- **Hover tooltips** on every KPI explaining the metric in plain language
- **Date range presets** (Today, 7D, 30D, 90D, YTD)
- **Revenue center filtering** (Dining Room, Bar, Patio, Takeout, Delivery, Catering)
- **Period-over-period comparison** toggle
- **Dark & light mode** support
- **Responsive layout** for desktop and tablet
- **Live service indicator** in the header

## Authentication

Auth is handled via Supabase. The `_authenticated` layout route guards all dashboard pages:

- Unauthenticated users are redirected to `/auth`
- Authenticated users hitting `/auth` are redirected to `/floor`

Social login (Google) is configured by default.

## Data Model

Currently the app uses **demo data generators** (`src/lib/demo-data.ts`) to produce realistic restaurant metrics. Each generator is deterministic based on the selected date range and revenue center, so the numbers feel coherent but are not tied to any real business.

To connect a real data source, replace the demo generators with:
- **POS API** imports (Square, Toast, Clover, etc.)
- **Accounting system** integrations (QuickBooks, Xero)
- **Direct database** reads via Supabase server functions

## Customization

### Theme Tokens

Colors, surfaces, and opacity values are defined as CSS custom properties in `src/styles.css`. Update the `@theme` block to rebrand:

```css
@theme {
  --color-accent: #3b82f6;
  --color-background: #0f172a;
  /* ... */
}
```

### Background Images

Each tab has its own background image defined in `DashboardShell.tsx`. Swap the imports in:

```tsx
import bgFloor from "@/assets/bg-floor.jpg";
import bgOffice from "@/assets/bg-office.jpg";
/* ... */
```

### KPI Definitions

Edit tooltips and thresholds directly in each route file (e.g., `src/routes/_authenticated.floor.tsx`).

## License

MIT
