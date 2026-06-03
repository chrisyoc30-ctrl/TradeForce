/** Browser persistence for matched-trade identity (P1-7). */

export const TRADESPERSON_ID_STORAGE_KEY = "tradescore-tradesperson-id";

/** Matches production IDs e.g. TS-JE7SEL, TS-TEST01. */
export function isValidTradespersonIdFormat(tradeId: string): boolean {
  const t = tradeId.trim().toUpperCase();
  return /^TS-[A-Z0-9]{4,16}$/.test(t);
}

/**
 * Persist tradesperson ID from URL or API response.
 * URL/session value wins over a different existing localStorage value.
 */
export function persistTradespersonIdFromUrl(tradeId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = tradeId.trim().toUpperCase();
  if (!isValidTradespersonIdFormat(normalized)) {
    return;
  }
  const existing = (
    window.localStorage.getItem(TRADESPERSON_ID_STORAGE_KEY) ?? ""
  )
    .trim()
    .toUpperCase();
  if (existing && existing !== normalized) {
    console.warn(
      `TS-ID mismatch: localStorage=${existing} url=${normalized} - using URL`,
    );
  }
  window.localStorage.setItem(TRADESPERSON_ID_STORAGE_KEY, normalized);
}
