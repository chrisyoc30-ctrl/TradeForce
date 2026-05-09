import { ShieldCheck } from "lucide-react";

/** Thin trust strip below global chrome — honest process wording (not every trade has ID/insurance yet). */
export function GlobalTrustBanner() {
  return (
    <div
      className="border-b border-emerald-500/25 bg-emerald-950/40 py-2 text-emerald-100/95"
      role="note"
    >
      <div className="mx-auto flex max-w-6xl justify-center px-4 sm:px-6">
        <p className="flex flex-wrap items-center justify-center gap-2 text-center text-xs sm:text-sm">
          <ShieldCheck className="size-4 shrink-0 text-emerald-400" aria-hidden />
          <span>
            We verify tradespeople with Companies House checks, optional ID &amp; insurance
            document review, and exclusive matching — Glasgow-focused.
          </span>
        </p>
      </div>
    </div>
  );
}
