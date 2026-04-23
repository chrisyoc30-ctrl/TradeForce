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

export type DisputeNotificationEmailProps = {
  recipientName: string;
  disputeId: string;
  roleLabel: "homeowner" | "tradesperson";
  summary: string;
  respondUrl: string;
  /** Optional deadline copy e.g. "Please respond within 5 business days" */
  deadlineNote?: string;
};

export function DisputeNotificationEmail({
  recipientName,
  disputeId,
  roleLabel,
  summary,
  respondUrl,
  deadlineNote,
}: DisputeNotificationEmailProps) {
  const name = recipientName.trim() || "there";
  const preview =
    roleLabel === "homeowner"
      ? "A dispute has been raised on your TradeScore job — review next steps."
      : "A dispute has been raised on a TradeScore lead — action may be required.";

  return (
    <TradeScoreLayout preview={preview}>
      <EmailHeading>Dispute notification</EmailHeading>
      <EmailLead>
        Hi {name}, a dispute has been logged on {EMAIL_BRAND.name} involving
        your account as a <strong>{roleLabel}</strong>. We’re here to help reach
        a fair outcome.
      </EmailLead>
      <Section
        style={{
          backgroundColor: "#fff7ed",
          borderRadius: "8px",
          padding: "16px 18px",
          border: `1px solid #fed7aa`,
        }}
      >
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            fontWeight: 600,
            color: EMAIL_BRAND.accent,
            letterSpacing: "0.04em",
          }}
        >
          Dispute ID: {disputeId}
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: "22px",
            color: EMAIL_BRAND.text,
          }}
        >
          {summary}
        </Text>
      </Section>
      {deadlineNote ? (
        <EmailMuted>
          <strong>Timing:</strong> {deadlineNote}
        </EmailMuted>
      ) : null}
      <EmailMuted>
        Please review the case details and provide any evidence or context
        requested. Staying responsive helps us resolve things faster.
      </EmailMuted>
      <EmailCta href={respondUrl}>View dispute & respond</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Questions about the process? Email {EMAIL_BRAND.supportEmail} and
        include dispute ID <strong>{disputeId}</strong>.
      </EmailMuted>
    </TradeScoreLayout>
  );
}
