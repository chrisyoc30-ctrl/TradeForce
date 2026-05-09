import Link from "next/link";
import { Building2, Lock, Shield, UserCheck } from "lucide-react";

import { Brandmark } from "@/components/ui/brandmark";
import { tradesSignupOrangeSolidCtaClasses } from "@/lib/cta-tailwind";

export function HomeFooter() {
  return (
    <footer
      className="border-t border-white/10 px-4 py-10 sm:px-6"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl">
        <section
          className="mb-10 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-8 sm:px-6"
          aria-labelledby="footer-trust-heading"
        >
          <div className="mb-6 text-center">
            <h2
              id="footer-trust-heading"
              className="text-lg font-semibold text-foreground"
            >
              Why trust TradeScore
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Rigorous checks where it matters; your privacy by design.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <Building2 className="mx-auto mb-2 size-8 text-sky-400" aria-hidden />
              <p className="text-sm font-medium text-foreground">Companies House</p>
              <p className="text-xs text-muted-foreground">Register lookup at signup</p>
            </div>
            <div className="text-center">
              <UserCheck className="mx-auto mb-2 size-8 text-emerald-400" aria-hidden />
              <p className="text-sm font-medium text-foreground">ID review</p>
              <p className="text-xs text-muted-foreground">Manual document checks</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto mb-2 size-8 text-violet-400" aria-hidden />
              <p className="text-sm font-medium text-foreground">Insurance review</p>
              <p className="text-xs text-muted-foreground">When certificates are uploaded</p>
            </div>
            <div className="text-center">
              <Lock className="mx-auto mb-2 size-8 text-[#FF6B35]" aria-hidden />
              <p className="text-sm font-medium text-foreground">Privacy protected</p>
              <p className="text-xs text-muted-foreground">Details shared only after match</p>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-center text-xs text-muted-foreground">
            Badges on your matched tradesperson reflect checks actually completed — not every trade
            shows ID or insurance until reviewed.
          </p>
        </section>

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
            <Link href="/how-we-verify" className="hover:text-foreground">
              How we verify
            </Link>
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
