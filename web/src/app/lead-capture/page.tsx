import type { Metadata } from "next";

import { LeadCapture } from "@/components/lead-capture/LeadCapture";

export const metadata: Metadata = {
  title: "Post your job — match with a verified Glasgow trade",
  description:
    "Free job posting. Exclusive matching to ONE tradesperson. Companies House checks plus optional ID & insurance review. Your details stay private until the match is confirmed.",
};

export default function LeadCapturePage() {
  return <LeadCapture />;
}
