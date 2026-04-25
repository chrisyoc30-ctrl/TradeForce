import { describe, expect, it } from "vitest";

import { calculateQuoteEstimate } from "./quote-estimate";

describe("calculateQuoteEstimate", () => {
  it("applies urgency multiplier for this week", () => {
    const q = calculateQuoteEstimate(2000, "this week", "simple");
    expect(q.timelineMultiplier).toBe(1.3);
    expect(q.min).toBeLessThanOrEqual(q.max);
  });

  it("parses budget with currency symbols", () => {
    const q = calculateQuoteEstimate("£1,500", "flexible", "medium");
    expect(q.priorityBand).toBeDefined();
    expect(q.mid).toBeGreaterThan(0);
  });
});
