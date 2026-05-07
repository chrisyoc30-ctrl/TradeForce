/** Single source of truth for public pricing (GBP). */
export const TRADESMAN_LEAD_PRICE_GBP = 25;

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
    priceLabel: `£${TRADESMAN_LEAD_PRICE_GBP} per lead`,
    summary: "Flat fee per lead — no commission.",
    headline:
      `For tradesmen: £${TRADESMAN_LEAD_PRICE_GBP} per lead (first lead FREE)`,
    points: [
      "First lead is FREE — try the service on us",
      `After your first lead: £${TRADESMAN_LEAD_PRICE_GBP} per lead when you accept a lead`,
      "No monthly subscription — only pay when you accept a lead",
      "No commission — you keep 100% of what homeowners pay you",
    ] as const,
  },
} as const;
