import { useEffect, useState } from "react";

const TS_ID_STORAGE = "tradescore-tradesperson-id";

function readStoredTradespersonId(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(TS_ID_STORAGE) ?? "").trim();
}

/**
 * Server-backed: true when this tradesperson can still use their one free lead,
 * for this lead context. Requires stored tradesperson ID and lead id.
 */
export function useFirstFreeLeadEligibility(leadId: string): boolean {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setEligible(false);
      return;
    }
    const tid = readStoredTradespersonId();
    if (!tid) {
      setEligible(false);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/leads/${encodeURIComponent(leadId)}/check-free-lead?tradeId=${encodeURIComponent(tid)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setEligible(Boolean((j as { canUseFree?: boolean }).canUseFree));
      })
      .catch(() => {
        if (!cancelled) setEligible(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  return eligible;
}
