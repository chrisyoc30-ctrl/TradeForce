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

export type OnboardingFindLeadsEmailProps = OnboardingBaseProps & {
  browseLeadsUrl: string;
};

export function OnboardingFindLeadsEmail({
  firstName,
  tradeType,
  browseLeadsUrl,
  marketingPreferencesUrl,
  marketingUnsubscribeUrl,
}: OnboardingFindLeadsEmailProps) {
  const name = firstName.trim() || "there";
  const trade = tradeType.trim() || "your trade";

  return (
    <TradeScoreLayout
      preview={`${name}, here’s how to find quality ${trade} leads on TradeScore.`}
      marketingPreferencesUrl={marketingPreferencesUrl}
      marketingUnsubscribeUrl={marketingUnsubscribeUrl}
    >
      <EmailHeading>How to find quality leads</EmailHeading>
      <EmailLead>
        Hi {name}, since you joined as a <strong>{trade}</strong> on{" "}
        {EMAIL_BRAND.name}, we want you finding leads that are worth your time —
        not scrolling through noise. Here’s a simple flow that works.
      </EmailLead>
      <EmailMuted>
        <strong>Step 1 — Open your lead list.</strong> From your dashboard,
        browse enquiries we’ve matched to your trade and service area. Each
        card should show the job type, location, and enough detail to decide if
        it’s a fit.
      </EmailMuted>
      <EmailMuted>
        <strong>Step 2 — Use scoring as a signal.</strong> We surface AI-assisted
        scoring so you can prioritise serious homeowners and clearer briefs.
        High intent doesn’t guarantee a win — but it usually means less
        back-and-forth before you quote.
      </EmailMuted>
      <EmailMuted>
        <strong>Step 3 — Shortlist before you commit.</strong> You’re in
        control: only accept a lead when you’re ready to follow up. Until then,
        browsing is free — take your time to compare what’s live.
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
          Make it a habit to check in once or twice a day early on — the best
          leads move quickly, and a fast first response helps you stand out.
        </Text>
      </Section>
      <EmailCta href={browseLeadsUrl}>Browse available leads</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Stuck on anything? {EMAIL_BRAND.supportEmail} — we’re happy to help.
      </EmailMuted>
    </TradeScoreLayout>
  );
}
