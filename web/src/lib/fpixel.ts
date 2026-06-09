/**
 * Meta (Facebook) Pixel helper.
 *
 * Mirrors the existing gtag pattern in `cookie-consent-banner.tsx`: the pixel only
 * loads/fires AFTER the user accepts cookies (UK GDPR / PECR). Nothing here runs
 * server-side. Set NEXT_PUBLIC_FB_PIXEL_ID in the environment to activate.
 */
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

const CONSENT_COOKIE = "cookie_consent"; // same key the consent banner writes

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

function consentAccepted(): boolean {
  if (typeof document === "undefined") return false;
  const m = document.cookie.match(/(?:^|;\s*)cookie_consent=(accepted|declined)/);
  if (m?.[1]) return m[1] === "accepted";
  try {
    return localStorage.getItem(CONSENT_COOKIE) === "accepted";
  } catch {
    return false;
  }
}

/**
 * Inject the Meta Pixel base code + fire the initial PageView — but only if the
 * user has consented and a Pixel ID is configured. Safe to call repeatedly
 * (no-ops once loaded). Call this on consent acceptance and on app mount.
 */
export function initPixelIfConsented(): void {
  if (typeof window === "undefined") return;
  if (!FB_PIXEL_ID) return;
  if (!consentAccepted()) return;
  if (window.fbq) return; // already loaded

  /* eslint-disable */
  // Standard Meta Pixel bootstrap (adapted to inject only post-consent).
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  // The IIFE above assigns window.fbq through an `any` alias, which TS can't see
  // (it narrowed fbq to undefined at the earlier guard) — re-read via a cast.
  const fbq = window.fbq as ((...args: unknown[]) => void) | undefined;
  fbq?.("init", FB_PIXEL_ID);
  fbq?.("track", "PageView");
}

/** Fire a PageView (used on client-side route changes). No-op until the pixel is loaded. */
export function pageview(): void {
  window.fbq?.("track", "PageView");
}

/** Fire a standard event (e.g. "Lead", "CompleteRegistration"). No-op until loaded. */
export function track(event: string, params: Record<string, unknown> = {}): void {
  window.fbq?.("track", event, params);
}
