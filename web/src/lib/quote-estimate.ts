export type ProjectComplexity = "simple" | "medium" | "complex";

export type ScoreBreakdown = {
  contactQuality: number;
  projectValue: number;
  urgency: number;
  budget: number;
  timeline: number;
};

export type QuoteBreakdown = {
  base: number;
  budgetAdjustment: number;
  budgetAdjustmentLabel: string;
  complexity: ProjectComplexity;
  complexityMultiplier: number;
  timeline: string;
  timelineMultiplier: number;
  timelineLabel: string;
  mid: number;
  min: number;
  max: number;
  /** For card border/background: urgency band */
  priorityBand: "low" | "medium" | "high";
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

/** When no band is selected — wide illustrative range only. */
const NO_BAND_ILLUSTRATIVE: { min: number; max: number } = {
  min: 2_500,
  max: 12_000,
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

/**
 * Band midpoint × complexity × timeline, then a ±15% range.
 */
export function calculateQuoteEstimate(
  budgetRaw: string | number | undefined,
  timeline: string | undefined,
  complexity: ProjectComplexity
): QuoteBreakdown {
  const t = (timeline ?? "").toLowerCase();
  let timelineMultiplier = 1;
  let timelineLabel = "Default timeline (no change)";
  if (t.includes("this week") || t.includes("asap") || t.includes("urgent")) {
    timelineMultiplier = 1.3;
    timelineLabel = "This week / urgent (+30%)";
  } else if (t.includes("this month") || t.includes("month")) {
    timelineMultiplier = 1.1;
    timelineLabel = "This month (+10%)";
  } else if (t.includes("flexib") || t.includes("any time")) {
    timelineMultiplier = 0.95;
    timelineLabel = "Flexible (−5%)";
  }

  const complexityMap: Record<ProjectComplexity, number> = {
    simple: 1,
    medium: 1.5,
    complex: 2,
  };
  const complexityMultiplier = complexityMap[complexity] ?? 1;

  let bounds: { min: number; max: number };
  let base: number;
  let budgetAdjustmentLabel: string;

  if (budgetRaw === undefined || budgetRaw === null || budgetRaw === "") {
    bounds = NO_BAND_ILLUSTRATIVE;
    base = Math.round((bounds.min + bounds.max) / 2);
    budgetAdjustmentLabel = "No band selected (illustrative range)";
  } else if (typeof budgetRaw === "string" && BUDGET_BAND_BOUNDS[budgetRaw.trim()]) {
    bounds = BUDGET_BAND_BOUNDS[budgetRaw.trim()];
    base = Math.round((bounds.min + bounds.max) / 2);
    budgetAdjustmentLabel = "Within your selected price band";
  } else {
    const n = parseLooseNumber(budgetRaw);
    if (n > 0) {
      bounds = { min: n * 0.8, max: n * 1.2 };
      base = Math.round(n);
      budgetAdjustmentLabel = "From your budget figure";
    } else {
      bounds = NO_BAND_ILLUSTRATIVE;
      base = Math.round((bounds.min + bounds.max) / 2);
      budgetAdjustmentLabel = "No band selected (illustrative range)";
    }
  }

  const bandMid = (bounds.min + bounds.max) / 2;
  const subtotal = bandMid * complexityMultiplier;
  const mid = subtotal * timelineMultiplier;
  const min = Math.round(mid * 0.85);
  const max = Math.round(mid * 1.15);

  let priorityBand: "low" | "medium" | "high" = "medium";
  if (t.includes("this week") || t.includes("asap") || t.includes("urgent")) {
    priorityBand = "high";
  } else if (t.includes("flexib") || t.includes("any time")) {
    priorityBand = "low";
  }

  return {
    base,
    budgetAdjustment: 0,
    budgetAdjustmentLabel,
    complexity,
    complexityMultiplier,
    timeline: timeline ?? "",
    timelineMultiplier,
    timelineLabel,
    mid: Math.round(mid * 100) / 100,
    min,
    max,
    priorityBand,
  };
}
