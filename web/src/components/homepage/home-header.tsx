import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const accent = "#FF6B35";

export function HomeHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
          aria-label="TradeScore home"
        >
          Trade<span style={{ color: accent }}>Score</span>
        </Link>
        <nav
          className="flex min-w-0 flex-1 justify-center gap-4 overflow-x-auto whitespace-nowrap px-2 text-xs text-muted-foreground sm:gap-5 sm:text-sm md:justify-center md:gap-6"
          aria-label="Primary"
        >
          <Link
            href="/pricing"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/faq"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
          <Link
            href="/terms"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/lead-capture"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            Post a job
          </Link>
          <Link
            href="/homeowner-dashboard"
            className="hidden shrink-0 transition-colors hover:text-foreground sm:inline"
          >
            My projects
          </Link>
          <Link
            href="/tradesman-signup"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            For trades
          </Link>
          <Link
            href="/lead-scoring"
            className="hidden shrink-0 transition-colors hover:text-foreground sm:inline"
          >
            Browse leads
          </Link>
          <Link
            href="/available-jobs"
            className="hidden shrink-0 transition-colors hover:text-foreground md:inline"
          >
            Available jobs
          </Link>
          <Link
            href="/admin/analytics"
            className="hidden shrink-0 text-muted-foreground/80 transition-colors hover:text-foreground lg:inline"
          >
            Admin
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/lead-capture"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Homeowners
          </Link>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
            )}
          >
            Trades
          </Link>
        </div>
      </div>
    </header>
  );
}
