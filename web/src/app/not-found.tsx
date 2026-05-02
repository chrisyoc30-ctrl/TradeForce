import Link from "next/link";

import { HomeFooter } from "@/components/homepage/home-footer";
import {
  postJobOrangeSolidCtaClasses,
  tradesSignupOrangeSolidCtaClasses,
} from "@/lib/cta-tailwind";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-foreground">
      <main
        id="main-content"
        className="mx-auto max-w-lg px-6 py-24 text-center"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <Link href="/lead-capture" className={postJobOrangeSolidCtaClasses}>
            Post a job
          </Link>
          <Link href="/tradesman-signup" className={tradesSignupOrangeSolidCtaClasses}>
            Join TradeScore
          </Link>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
