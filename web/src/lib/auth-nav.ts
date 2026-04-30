/** Lightweight “session” key after a homeowner looks up jobs on the dashboard (no password yet). */

export const HOMEOWNER_SESSION_PHONE_KEY = "tradescore-homeowner-phone";

export const AUTH_CHANGED_EVENT = "tradescore-auth-changed";

export function getLoginUrl(): string {
  return "/homeowner-dashboard";
}

export function persistHomeownerSessionPhone(phoneDigits: string) {
  const t = phoneDigits.trim();
  if (typeof window === "undefined" || t.length < 8) return;
  try {
    sessionStorage.setItem(HOMEOWNER_SESSION_PHONE_KEY, t);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    /* private mode */
  }
}

export function clearHomeownerSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(HOMEOWNER_SESSION_PHONE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    /* private mode */
  }
}
