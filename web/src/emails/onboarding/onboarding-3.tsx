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

export type OnboardingAcceptLeadsEmailProps = OnboardingBaseProps & {
  acceptLeadUrl: string;
};

export function OnboardingAcceptLeadsEmail({
  firstName,
  tradeType,
  acceptLeadUrl,
  marketingPreferencesUrl,
  marketingUnsubscribeUrl,
}: OnboardingAcceptLeadsEmailProps) {
  const name = firstName.trim() || "there";
  const trade = tradeType.trim() || "your trade";

  return (
    <TradeScoreLayout
      preview={`Ready to accept a lead, ${name}? Here’s exactly what happens next.`}
      marketingPreferencesUrl={marketingPreferencesUrl}
      marketingUnsubscribeUrl={marketingUnsubscribeUrl}
    >
      <EmailHeading>Accept your first lead</EmailHeading>
      <EmailLead>
        Hi {name}, you’ve been exploring {trade} leads — great. When you’re
        ready, accepting a lead is the moment you tell us (and the homeowner)
        you’re serious about quoting the job.
      </EmailLead>
      <EmailMuted>
        <strong>What “accept” means.</strong> You’re choosing to unlock that
        enquiry and move to direct follow-up: introduce yourself, ask smart
        questions, and book a visit or quote. You’re not locked into the job —
        you’re committing to a professional conversation.
      </EmailMuted>
      <EmailMuted>
        <strong>What happens next.</strong> After you accept, you’ll complete
        secure payment for the lead fee (your <strong>first lead may be free
        </strong> — check your account banner). Once payment succeeds, you get
        full access to the details you need to respond quickly.
      </EmailMuted>
      <EmailMuted>
        <strong>Speed wins.</strong> Homeowners often contact several trades.
        A prompt, friendly reply — even a short “I’ve reviewed this and can
        visit Tuesday” — builds trust before you’ve met.
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
          Pick one lead that fits your skills and diary, then accept when you’re
          ready to follow through. Small, consistent actions beat waiting for a
          “perfect” week.
        </Text>
      </Section>
      <EmailCta href={acceptLeadUrl}>Accept a lead now</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Need help with checkout? {EMAIL_BRAND.supportEmail}
      </EmailMuted>
    </TradeScoreLayout>
  );
}
