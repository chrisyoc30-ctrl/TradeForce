export { EMAIL_BRAND, fontStack } from "./constants";
export { renderEmail } from "./render-email";

export {
  TradeScoreLayout,
  EmailHeading,
  EmailLead,
  EmailMuted,
  EmailCta,
  EmailDivider,
} from "./components/trade-score-layout";
export type { TradeScoreLayoutProps } from "./components/trade-score-layout";

export { WelcomeTradesmanEmail } from "./welcome-tradesman";
export type { WelcomeTradesmanEmailProps } from "./welcome-tradesman";

export { LeadNotificationEmail } from "./lead-notification";
export type { LeadNotificationEmailProps } from "./lead-notification";

export { PaymentConfirmationEmail } from "./payment-confirmation";
export type { PaymentConfirmationEmailProps } from "./payment-confirmation";

export { PaymentFailedEmail } from "./payment-failed";
export type { PaymentFailedEmailProps } from "./payment-failed";

export { SupportTicketReceivedEmail } from "./support-ticket-received";
export type { SupportTicketReceivedEmailProps } from "./support-ticket-received";

export { SupportTicketResolvedEmail } from "./support-ticket-resolved";
export type { SupportTicketResolvedEmailProps } from "./support-ticket-resolved";

export { DisputeNotificationEmail } from "./dispute-notification";
export type { DisputeNotificationEmailProps } from "./dispute-notification";

export {
  ONBOARDING_EMAIL_SUBJECTS,
  OnboardingWelcomeEmail,
  OnboardingFindLeadsEmail,
  OnboardingAcceptLeadsEmail,
  OnboardingPaymentsEmail,
  OnboardingSuccessTipsEmail,
} from "./onboarding";
export type {
  OnboardingEmailId,
  OnboardingBaseProps,
  OnboardingWelcomeEmailProps,
  OnboardingFindLeadsEmailProps,
  OnboardingAcceptLeadsEmailProps,
  OnboardingPaymentsEmailProps,
  OnboardingSuccessTipsEmailProps,
} from "./onboarding";
