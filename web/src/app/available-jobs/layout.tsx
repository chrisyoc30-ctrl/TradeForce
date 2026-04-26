import type { ReactNode } from "react";

export const metadata = {
  title: "Available jobs",
  description:
    "Browse and bid on Glasgow trade leads with your TradeScore tradesperson ID — £25 per accepted lead, first free.",
};

export default function AvailableJobsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
