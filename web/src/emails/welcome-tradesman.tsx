import { Section, Text } from "@react-email/components";

import {
  EmailCta,
  EmailDivider,
  EmailHeading,
  EmailLead,
  EmailMuted,
  TradeScoreLayout,
} from "./components/trade-score-layout";
import { EMAIL_BRAND } from "./constants";

export type WelcomeTradesmanEmailProps = {
  firstName: string;
  dashboardUrl: string;
  /** Optional marketing links for product tips (welcome can include opt-out). */
  marketingPreferencesUrl?: string;
  marketingUnsubscribeUrl?: string;
};

export function WelcomeTradesmanEmail({
  firstName,
  dashboardUrl,
  marketingPreferencesUrl,
  marketingUnsubscribeUrl,
}: WelcomeTradesmanEmailProps) {
  const name = firstName.trim() || "there";

  return (
    <TradeScoreLayout
      preview={`Welcome to ${EMAIL_BRAND.name} — here’s how to get started.`}
      marketingPreferencesUrl={marketingPreferencesUrl}
      marketingUnsubscribeUrl={marketingUnsubscribeUrl}
    >
      <EmailHeading>Welcome to TradeScore!</EmailHeading>
      <EmailLead>
        Hi {name}, thanks for joining {EMAIL_BRAND.name}. You’re set up to
        receive quality leads from homeowners in your area.
      </EmailLead>
      <EmailMuted>
        Here’s how to get started: complete your profile, choose your trade
        categories, and keep notifications on so you never miss a new lead.
      </EmailMuted>
      <Section>
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "15px",
            lineHeight: "24px",
            color: EMAIL_BRAND.text,
          }}
        >
          <strong>Next steps</strong>
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: "15px",
            lineHeight: "24px",
            color: EMAIL_BRAND.muted,
          }}
        >
          1. Review your profile and service areas
          <br />
          2. Open the dashboard when we notify you of new leads
          <br />
          3. Accept leads that fit your schedule — pay only when you accept
        </Text>
      </Section>
      <EmailCta href={dashboardUrl}>Go to your dashboard</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Need help getting started? Reply to this email or contact{" "}
        {EMAIL_BRAND.supportEmail} — we’re happy to help.
      </EmailMuted>
    </TradeScoreLayout>
  );
}
