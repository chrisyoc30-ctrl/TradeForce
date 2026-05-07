/** Single source of truth for public pricing (GBP). */
export const TRADESMAN_LEAD_PRICE_GBP = 25;
export const TRADESMAN_UNLIMITED_MONTHLY_GBP = 99;

export const pricingCopy = {
  brandLine: "Simple pricing — no surprises.",

  homeowners: {
    title: "For homeowners",
    priceLabel: "FREE",
    summary: "Always FREE to submit projects.",
    points: [
      "Post jobs and describe your project at no cost",
      "No subscription — homeowners never pay TradeScore to list work",
    ] as const,
  },

  trades: {
    title: "For tradespeople",
    priceLabel: `£${TRADESMAN_LEAD_PRICE_GBP} per lead or Unlimited`,
    summary: `Pay per unlock or £${TRADESMAN_UNLIMITED_MONTHLY_GBP}/month — flat fee — no commission.`,
    headline:
      `£${TRADESMAN_LEAD_PRICE_GBP} per lead (first lead FREE) · or Unlimited at £${TRADESMAN_UNLIMITED_MONTHLY_GBP}/month`,
    points: [
      "First lead is FREE — try the service on us",
      `Pay-per-lead: £${TRADESMAN_LEAD_PRICE_GBP} per lead when you accept after your free one`,
      `Unlimited subscription: £${TRADESMAN_UNLIMITED_MONTHLY_GBP}/month — no per-lead charge on unlocks`,
      "No commission — you keep 100% of what homeowners pay you",
    ] as const,
  },
} as const;
