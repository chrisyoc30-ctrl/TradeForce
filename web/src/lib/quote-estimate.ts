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

function parseBudget(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  if (typeof raw === "number" && !Number.isNaN(raw)) return Math.max(0, raw);
  const n = parseFloat(
    String(raw).replace(/[£$,\s]/g, "")
  );
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * (Base + Budget adjustment) × Complexity × Timeline multiplier, then a ±15% range.
 */
export function calculateQuoteEstimate(
  budgetRaw: string | number | undefined,
  timeline: string | undefined,
  complexity: ProjectComplexity
): QuoteBreakdown {
  const base = 50;
  const budget = parseBudget(budgetRaw);

  let budgetAdjustment = 0;
  let budgetAdjustmentLabel = "No extra budget weighting";
  if (budget > 5000) {
    budgetAdjustment = base * 0.4;
    budgetAdjustmentLabel = "+40% of base (budget over £5,000)";
  } else if (budget > 1000) {
    budgetAdjustment = base * 0.2;
    budgetAdjustmentLabel = "+20% of base (budget over £1,000)";
  }

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

  const subtotal = (base + budgetAdjustment) * complexityMultiplier;
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
    budgetAdjustment: Math.round(budgetAdjustment * 100) / 100,
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
