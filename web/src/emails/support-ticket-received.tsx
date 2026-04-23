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

export type SupportTicketReceivedEmailProps = {
  recipientName: string;
  ticketId: string;
  subjectLine: string;
  helpCenterUrl?: string;
  /** Target response time copy, default 24 hours */
  responseSlaHours?: number;
};

export function SupportTicketReceivedEmail({
  recipientName,
  ticketId,
  subjectLine,
  helpCenterUrl,
  responseSlaHours = 24,
}: SupportTicketReceivedEmailProps) {
  const name = recipientName.trim() || "there";

  return (
    <TradeScoreLayout
      preview={`We received your support request — we’ll respond within ${responseSlaHours} hours.`}
    >
      <EmailHeading>We’ve got your message</EmailHeading>
      <EmailLead>
        Hi {name}, thanks for contacting {EMAIL_BRAND.name}.{" "}
        <strong>
          We received your support request and aim to respond within{" "}
          {responseSlaHours} hours
        </strong>{" "}
        (often sooner during business days).
      </EmailLead>
      <EmailMuted>
        <strong>Ticket ID:</strong> {ticketId}
        <br />
        <strong>Subject:</strong> {subjectLine}
      </EmailMuted>
      <EmailMuted>
        Our team will reply from {EMAIL_BRAND.supportEmail}. If you don’t see
        our response, please check spam or promotions folders.
      </EmailMuted>
      {helpCenterUrl ? (
        <EmailCta href={helpCenterUrl}>Visit help centre</EmailCta>
      ) : null}
      <EmailDivider />
      <Text
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "20px",
          color: EMAIL_BRAND.muted,
          textAlign: "center",
        }}
      >
        Need to add more detail? Reply to this email and include your ticket
        ID.
      </Text>
    </TradeScoreLayout>
  );
}
