/**
 * UTM capture.
 *
 * Ads land on the homepage with ?utm_source=meta&utm_medium=paid&utm_campaign=...
 * The user then navigates to /lead-capture (no UTMs in that URL), so we must capture
 * them on first load and stash them for the duration of the session. Read them back
 * when a lead is submitted for attribution.
 */
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const STORAGE_KEY = "ts_utms";

export type Utms = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Capture any UTM params from the current URL into sessionStorage. Call on each page load. */
export function captureUtms(): void {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(window.location.search);
    const found: Utms = {};
    for (const k of UTM_KEYS) {
      const v = q.get(k);
      if (v) found[k] = v;
    }
    // Only overwrite if this load actually carried UTMs (don't wipe a prior capture).
    if (Object.keys(found).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  } catch {
    /* sessionStorage unavailable — ignore */
  }
}

/** Read the captured UTMs (empty object if none). */
export function getUtms(): Utms {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") as Utms;
  } catch {
    return {};
  }
}
