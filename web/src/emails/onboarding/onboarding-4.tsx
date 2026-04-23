import { Section, Text } from "@react-email/components";

import {
  EmailCta,
  EmailDivider,
  EmailHeading,
  EmailLead,
  EmailMuted,
  TradeScoreLayout,
} from "../components/trade-score-layout";
import { EMAIL_BRAND } from "../constants";
import type { OnboardingBaseProps } from "./types";

export type OnboardingPaymentsEmailProps = OnboardingBaseProps & {
  updatePaymentMethodUrl: string;
};

/**
 * Clarifies: lead acceptance fee on TradeScore vs. invoicing the homeowner for work.
 * Subject line matches stakeholder brief; body stays accurate to the product.
 */
export function OnboardingPaymentsEmail({
  firstName,
  tradeType,
  updatePaymentMethodUrl,
  marketingPreferencesUrl,
  marketingUnsubscribeUrl,
}: OnboardingPaymentsEmailProps) {
  const name = firstName.trim() || "there";
  const trade = tradeType.trim() || "your trade";

  return (
    <TradeScoreLayout
      preview={`${name}, here’s how payments work — lead fees, Stripe, and getting paid for jobs.`}
      marketingPreferencesUrl={marketingPreferencesUrl}
      marketingUnsubscribeUrl={marketingUnsubscribeUrl}
    >
      <EmailHeading>Payments &amp; getting paid</EmailHeading>
      <EmailLead>
        Hi {name}, let’s make money simple. On {EMAIL_BRAND.name} there are{" "}
        <strong>two different payments</strong> to keep straight: the{" "}
        <strong>lead fee</strong> (to us when you accept an enquiry) and the{" "}
        <strong>money you earn from the homeowner</strong> for the actual{" "}
        {trade} work — quotes, deposits, and invoices you agree with them
        directly.
      </EmailLead>
      <EmailMuted>
        <strong>Lead fee (platform).</strong> When you accept a lead, you pay{" "}
        <strong>£25</strong> at that moment (unless your <strong>first lead is
        free</strong> on your plan). We process this securely through{" "}
        <strong>Stripe</strong>. You’ll see confirmation in-app and can keep
        receipts for your records.
      </EmailMuted>
      <EmailMuted>
        <strong>Timeline.</strong> The lead fee is charged at acceptance — not
        monthly, not per click. If a payment fails, you’ll see a retry option;
        the lead stays pending until payment succeeds.
      </EmailMuted>
      <EmailMuted>
        <strong>Your earnings on the job.</strong> Once you’re in touch with the
        homeowner, you quote and get paid on your normal terms — TradeScore
        doesn’t sit in the middle of your invoice. That’s how you{" "}
        <strong>get paid for the work</strong> after the introduction.
      </EmailMuted>
      <Section>
        <Text
          style={{
            margin: 0,
            fontSize: "15px",
            lineHeight: "24px",
            color: EMAIL_BRAND.text,
          }}
        >
          Keep your card current so you never miss a lead you want. Update
          details anytime — it only takes a minute.
        </Text>
      </Section>
      <EmailCta href={updatePaymentMethodUrl}>Update payment method</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Billing questions? {EMAIL_BRAND.supportEmail} — include your account
        email and any lead reference.
      </EmailMuted>
    </TradeScoreLayout>
  );
}
