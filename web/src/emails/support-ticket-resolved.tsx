import { Text } from "@react-email/components";

import {
  EmailCta,
  EmailDivider,
  EmailHeading,
  EmailLead,
  EmailMuted,
  TradeScoreLayout,
} from "./components/trade-score-layout";
import { EMAIL_BRAND } from "./constants";

export type SupportTicketResolvedEmailProps = {
  recipientName: string;
  ticketId: string;
  resolutionSummary: string;
  reopenOrFeedbackUrl?: string;
};

export function SupportTicketResolvedEmail({
  recipientName,
  ticketId,
  resolutionSummary,
  reopenOrFeedbackUrl,
}: SupportTicketResolvedEmailProps) {
  const name = recipientName.trim() || "there";

  return (
    <TradeScoreLayout
      preview={`Your TradeScore support ticket ${ticketId} has been resolved.`}
    >
      <EmailHeading>Your issue is resolved</EmailHeading>
      <EmailLead>
        Hi {name}, we’ve closed ticket <strong>{ticketId}</strong>. Here’s a
        quick summary of what we did:
      </EmailLead>
      <Text
        style={{
          margin: "0 0 20px",
          padding: "16px 18px",
          backgroundColor: EMAIL_BRAND.pageBg,
          borderRadius: "8px",
          border: `1px solid ${EMAIL_BRAND.border}`,
          fontSize: "15px",
          lineHeight: "24px",
          color: EMAIL_BRAND.text,
        }}
      >
        {resolutionSummary}
      </Text>
      <EmailMuted>
        If something still doesn’t look right, reply to this email or open a
        new message to {EMAIL_BRAND.supportEmail} and mention your ticket ID —
        we’ll pick it up.
      </EmailMuted>
      {reopenOrFeedbackUrl ? (
        <EmailCta href={reopenOrFeedbackUrl}>Follow up or leave feedback</EmailCta>
      ) : null}
      <EmailDivider />
      <Text
        style={{
          margin: 0,
          fontSize: "14px",
          lineHeight: "22px",
          color: EMAIL_BRAND.muted,
          textAlign: "center",
        }}
      >
        Thanks for your patience — we appreciate you using {EMAIL_BRAND.name}.
      </Text>
    </TradeScoreLayout>
  );
}
