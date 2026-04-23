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

export type OnboardingSuccessTipsEmailProps = OnboardingBaseProps & {
  browseMoreLeadsUrl: string;
};

export function OnboardingSuccessTipsEmail({
  firstName,
  tradeType,
  browseMoreLeadsUrl,
  marketingPreferencesUrl,
  marketingUnsubscribeUrl,
}: OnboardingSuccessTipsEmailProps) {
  const name = firstName.trim() || "there";
  const trade = tradeType.trim() || "your trade";

  return (
    <TradeScoreLayout
      preview={`5 quick tips to earn more as a ${trade} on TradeScore, ${name}.`}
      marketingPreferencesUrl={marketingPreferencesUrl}
      marketingUnsubscribeUrl={marketingUnsubscribeUrl}
    >
      <EmailHeading>5 tips to maximise your earnings</EmailHeading>
      <EmailLead>
        Hi {name}, you’ve made it through your first week on {EMAIL_BRAND.name}{" "}
        — nice work. Here are five habits we see from {trade}s who convert leads
        into paid jobs.
      </EmailLead>
      <EmailMuted>
        <strong>1 — Reply in hours, not days.</strong> A short, professional
        first message beats a perfect paragraph that arrives late. Set a phone
        reminder to check leads twice daily while you’re ramping up.
      </EmailMuted>
      <EmailMuted>
        <strong>2 — Accept only what you can deliver.</strong> Your reputation
        travels. Passing on a poor-fit job protects your time and your reviews.
      </EmailMuted>
      <EmailMuted>
        <strong>3 — Ask two smart questions early.</strong> Timeline, access,
        materials — clarity now prevents surprises on site and speeds up your
        quote.
      </EmailMuted>
      <EmailMuted>
        <strong>4 — Quote with confidence.</strong> Homeowners compare trades;
        transparent pricing and a clear scope build trust faster than vague
        ranges.
      </EmailMuted>
      <EmailMuted>
        <strong>5 — Keep your profile sharp.</strong> Areas served, photos of
        past {trade} work, and accurate skills help our matching surface you for
        the right jobs.
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
          This is the last email in your onboarding series — you’re not on your
          own. We’re still here at {EMAIL_BRAND.supportEmail} whenever you need
          us.
        </Text>
      </Section>
      <EmailCta href={browseMoreLeadsUrl}>Browse more leads</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Want fewer emails? Use the links below to manage preferences or
        unsubscribe from onboarding tips (account notices may still be sent).
      </EmailMuted>
    </TradeScoreLayout>
  );
}
