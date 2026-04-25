import Link from "next/link";

import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeHeader } from "@/components/homepage/home-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-foreground">
      <HomeHeader />
      <main
        id="main-content"
        className="mx-auto max-w-lg px-6 py-24 text-center"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <Link
            href="/lead-capture"
            className={cn(
              buttonVariants({ size: "lg" }),
              "border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
            )}
          >
            Post a job
          </Link>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/20"
            )}
          >
            For tradespeople
          </Link>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
