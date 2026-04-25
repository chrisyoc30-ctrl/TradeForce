import { describe, expect, it } from "vitest";

import { TRADESMAN_LEAD_PRICE_GBP, pricingCopy } from "./pricing";

describe("pricing", () => {
  it("exports £25 lead price constant", () => {
    expect(TRADESMAN_LEAD_PRICE_GBP).toBe(25);
  });

  it("homeowners are free in copy", () => {
    expect(pricingCopy.homeowners.priceLabel).toMatch(/FREE/i);
  });

  it("trades headline mentions first lead free", () => {
    expect(pricingCopy.trades.headline.toLowerCase()).toContain("free");
  });
});
