import { describe, expect, it } from "vitest";

import { midpointForBudgetInput } from "./quote-estimate";

describe("midpointForBudgetInput", () => {
  it("uses band midpoint for known labels", () => {
    const mid = midpointForBudgetInput("£1,000 – £3,000");
    expect(mid).toBe(2_000);
  });

  it("parses loose numeric strings", () => {
    expect(midpointForBudgetInput("£1,500")).toBe(1500);
  });
});
