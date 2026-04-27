export type ScoreBreakdown = {
  contactQuality: number;
  projectValue: number;
  urgency: number;
  budget: number;
  timeline: number;
};

/** Budget band options for the lead capture form (value === label). */
export const LEAD_CAPTURE_BUDGET_RANGE_OPTIONS: readonly {
  value: string;
  label: string;
}[] = [
  { value: "", label: "Select a budget (optional)" },
  { value: "Under £500", label: "Under £500" },
  { value: "£500 – £1,000", label: "£500 – £1,000" },
  { value: "£1,000 – £3,000", label: "£1,000 – £3,000" },
  { value: "£3,000 – £5,000", label: "£3,000 – £5,000" },
  { value: "£5,000 – £10,000", label: "£5,000 – £10,000" },
  { value: "£10,000 – £25,000", label: "£10,000 – £25,000" },
  { value: "£25,000+", label: "£25,000+" },
  { value: "Not sure yet", label: "Not sure yet" },
] as const;

/** Min/max £ for each band (illustrative UK trade job scope). */
const BUDGET_BAND_BOUNDS: Record<string, { min: number; max: number }> = {
  "Under £500": { min: 150, max: 500 },
  "£500 – £1,000": { min: 500, max: 1_000 },
  "£1,000 – £3,000": { min: 1_000, max: 3_000 },
  "£3,000 – £5,000": { min: 3_000, max: 5_000 },
  "£5,000 – £10,000": { min: 5_000, max: 10_000 },
  "£10,000 – £25,000": { min: 10_000, max: 25_000 },
  "£25,000+": { min: 25_000, max: 75_000 },
  "Not sure yet": { min: 2_000, max: 20_000 },
};

function parseLooseNumber(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  if (typeof raw === "number" && !Number.isNaN(raw)) return Math.max(0, raw);
  const n = parseFloat(String(raw).replace(/[£$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Representative £ midpoint for bids and sorting when the lead has a band label
 * or legacy numeric string.
 */
export function midpointForBudgetInput(
  raw: string | number | undefined
): number {
  if (typeof raw === "number" && !Number.isNaN(raw)) return Math.max(0, raw);
  if (raw === undefined || raw === null) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const b = BUDGET_BAND_BOUNDS[s];
  if (b) return (b.min + b.max) / 2;
  return parseLooseNumber(s);
}
