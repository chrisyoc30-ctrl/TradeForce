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

export type OnboardingWelcomeEmailProps = OnboardingBaseProps & {
  viewFirstLeadUrl: string;
};

export function OnboardingWelcomeEmail({
  firstName,
  tradeType,
  viewFirstLeadUrl,
  marketingPreferencesUrl,
  marketingUnsubscribeUrl,
}: OnboardingWelcomeEmailProps) {
  const name = firstName.trim() || "there";
  const trade = tradeType.trim() || "your trade";

  return (
    <TradeScoreLayout
      preview={`You’re in, ${name} — here’s what to expect on TradeScore.`}
      marketingPreferencesUrl={marketingPreferencesUrl}
      marketingUnsubscribeUrl={marketingUnsubscribeUrl}
    >
      <EmailHeading>Welcome to TradeScore 🎉</EmailHeading>
      <EmailLead>
        Hi {name}, congratulations — your {trade} profile is live on{" "}
        {EMAIL_BRAND.name}. We’re glad you’re here.
      </EmailLead>
      <EmailMuted>
        Over the next week we’ll send a few short emails to help you get
        comfortable: how to spot strong leads, how accepting a lead works, how
        payments fit in, and habits that help you win more work. Nothing long —
        just the essentials so you can act fast when the right job appears.
      </EmailMuted>
      <EmailMuted>
        Here’s what you can expect right away: you’ll see homeowner enquiries
        matched to your trade and area. Your{" "}
        <strong>first accepted lead may be free</strong> (depending on your
        plan); after that, accepting a lead is <strong>£25</strong> — so you
        only pay when you choose to pursue a job. We’ll walk through the
        details in the next messages.
      </EmailMuted>
      <Section>
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: "15px",
            lineHeight: "24px",
            color: EMAIL_BRAND.text,
            fontWeight: 600,
          }}
        >
          Your next step
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: "15px",
            lineHeight: "24px",
            color: EMAIL_BRAND.muted,
          }}
        >
          Open your dashboard and review what’s available — when a lead looks
          like a fit, you’ll be ready to move in minutes, not hours.
        </Text>
      </Section>
      <EmailCta href={viewFirstLeadUrl}>View your first lead</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Questions? Reply to this email or write to {EMAIL_BRAND.supportEmail}{" "}
        — we read everything.
      </EmailMuted>
    </TradeScoreLayout>
  );
}
