import Link from "next/link";

import { Brandmark } from "@/components/ui/brandmark";
import { tradesSignupOrangeSolidCtaClasses } from "@/lib/cta-tailwind";

export function HomeFooter() {
  return (
    <footer
      className="border-t border-white/10 px-4 py-10 sm:px-6"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl">
        <Brandmark size="lg" asLink={false} className="mb-4 block text-center sm:text-left text-foreground" />
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center text-sm text-muted-foreground sm:text-left">
            <p>
              © 2026 TradeScore · Glasgow, Scotland ·{" "}
              <span className="text-foreground/80">AI-matched leads for real work</span>
            </p>
            <p className="mt-1">
              <a
                href="mailto:support@tradescore.uk"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                support@tradescore.uk
              </a>
            </p>
          </div>
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
            <Link href="/tradesman-signup" className={tradesSignupOrangeSolidCtaClasses}>
              Join TradeScore
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
