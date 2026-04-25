import Link from "next/link";

export function HomeFooter() {
  return (
    <footer
      className="border-t border-white/10 px-4 py-10 sm:px-6"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          © 2026 TradeScore · Glasgow ·{" "}
          <span className="text-foreground/80">AI-matched leads for real work</span>
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          aria-label="Footer"
        >
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/lead-capture" className="hover:text-foreground">
            Post a job
          </Link>
          <Link href="/tradesman-signup" className="hover:text-foreground">
            For tradespeople
          </Link>
        </nav>
      </div>
    </footer>
  );
}
