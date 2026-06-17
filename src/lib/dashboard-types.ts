/**
 * Shared display types for the dashboard feature pages.
 * Server functions in src/lib/dashboard.functions.ts return data already
 * shaped to these interfaces.
 */

export type MenuItemClassification = "Star" | "Plowhorse" | "Puzzle" | "Dog";

export interface MenuItem {
  name: string;
  category: string;
  price: number;
  cost: number;
  sold: number;
  revenue: number;
  margin: number;
  marginPct: number;
  classification: MenuItemClassification;
}

export type PipelineStage =
  | "Inquiry"
  | "Proposal"
  | "Confirmed"
  | "Deposit Paid"
  | "Lost";

export interface PipelineEvent {
  id: string;
  client: string;
  type: string;
  date: string;
  guests: number;
  value: number;
  stage: PipelineStage;
}

export const HEATMAP_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
export const HEATMAP_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface HeatmapCell {
  day: number;
  hour: number;
  covers: number;
  netSales: number;
}
