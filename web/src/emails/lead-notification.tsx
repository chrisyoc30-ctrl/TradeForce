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

export type LeadNotificationEmailProps = {
  tradesmanName: string;
  projectType: string;
  location: string;
  leadSummary: string;
  acceptLeadUrl: string;
  /** Optional e.g. "Offer expires in 48 hours" */
  urgencyNote?: string;
};

export function LeadNotificationEmail({
  tradesmanName,
  projectType,
  location,
  leadSummary,
  acceptLeadUrl,
  urgencyNote,
}: LeadNotificationEmailProps) {
  const name = tradesmanName.trim() || "there";

  return (
    <TradeScoreLayout
      preview={`New lead: ${projectType} in ${location} — open TradeScore to accept.`}
    >
      <EmailHeading>New lead available for you</EmailHeading>
      <EmailLead>
        Hi {name}, a homeowner has posted a job that matches your trade. Review
        the details and accept if it’s a good fit.
      </EmailLead>
      <Section
        style={{
          backgroundColor: EMAIL_BRAND.pageBg,
          borderRadius: "8px",
          padding: "16px 18px",
          border: `1px solid ${EMAIL_BRAND.border}`,
        }}
      >
        <Text
          style={{
            margin: "0 0 6px",
            fontSize: "13px",
            fontWeight: 600,
            color: EMAIL_BRAND.accent,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Lead details
        </Text>
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "16px",
            fontWeight: 600,
            color: EMAIL_BRAND.text,
          }}
        >
          {projectType}
        </Text>
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "14px",
            lineHeight: "22px",
            color: EMAIL_BRAND.muted,
          }}
        >
          <strong style={{ color: EMAIL_BRAND.text }}>Area:</strong> {location}
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: "22px",
            color: EMAIL_BRAND.muted,
          }}
        >
          {leadSummary}
        </Text>
      </Section>
      {urgencyNote ? (
        <EmailMuted>
          <strong>Heads up:</strong> {urgencyNote}
        </EmailMuted>
      ) : null}
      <EmailCta href={acceptLeadUrl}>Accept this lead</EmailCta>
      <EmailDivider />
      <EmailMuted>
        If this job isn’t right for you, you can ignore this email — no charge
        until you accept a lead on {EMAIL_BRAND.name}.
      </EmailMuted>
    </TradeScoreLayout>
  );
}
