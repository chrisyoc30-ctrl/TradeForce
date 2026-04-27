import { useEffect, useState } from "react";

const FREE_LEAD_KEY = "tradescore_free_lead_used";

/**
 * True when the user has not yet used their one free lead (client-side key).
 */
export function useFirstFreeLeadEligibility(): boolean {
  const [eligible, setEligible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEligible(window.localStorage.getItem(FREE_LEAD_KEY) !== "1");
  }, []);

  return eligible;
}
