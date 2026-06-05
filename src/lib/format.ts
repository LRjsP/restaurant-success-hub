export const fmtCurrency = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n || 0);

export const fmtCurrency2 = (n: number) => fmtCurrency(n, { maximumFractionDigits: 2 });

export const fmtNumber = (n: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n || 0);

export const fmtPct = (n: number, digits = 1) =>
  `${(n * 100).toFixed(digits)}%`;

export const fmtPctRaw = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const fmtDelta = (n: number) => {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
};

export const pctChange = (current: number, prev: number): number => {
  if (!prev) return 0;
  return ((current - prev) / prev) * 100;
};

export const REVENUE_CENTERS = [
  { value: "all", label: "All Centers" },
  { value: "dining_room", label: "Main Dining Room" },
  { value: "bar", label: "Bar" },
  { value: "patio", label: "Patio" },
  { value: "takeout", label: "Takeout" },
  { value: "delivery", label: "Delivery" },
  { value: "catering", label: "Catering" },
] as const;

export const DATE_PRESETS = [
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "7 Days", days: 7 },
  { value: "30d", label: "30 Days", days: 30 },
  { value: "90d", label: "90 Days", days: 90 },
  { value: "ytd", label: "YTD", days: 365 },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["value"];

export function getDateRange(preset: DatePreset): { from: string; to: string; prevFrom: string; prevTo: string } {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const to = new Date(today);
  const from = new Date(today);
  const presetCfg = DATE_PRESETS.find((p) => p.value === preset)!;
  from.setUTCDate(from.getUTCDate() - (presetCfg.days - 1));
  const span = presetCfg.days;
  const prevTo = new Date(from);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (span - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to), prevFrom: iso(prevFrom), prevTo: iso(prevTo) };
}
