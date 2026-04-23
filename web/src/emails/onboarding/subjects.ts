/** Use these as `Subject` when sending; keep in sync with `ONBOARDING_SEQUENCE.md`. */
export const ONBOARDING_EMAIL_SUBJECTS = {
  1: "Welcome to TradeScore! 🎉",
  2: "How to find quality leads on TradeScore",
  3: "Accept your first lead and start earning",
  4: "How to get paid for your leads",
  5: "5 tips to maximize your earnings on TradeScore",
} as const;

export type OnboardingEmailId = keyof typeof ONBOARDING_EMAIL_SUBJECTS;
