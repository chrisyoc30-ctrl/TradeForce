import Link from "next/link";
import { Building2, Shield, UserCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Homepage trust section — describes our verification *process*.
 * Individual badges on matches reflect actual database status.
 */
export function HowWeVerifySection() {
  return (
    <section
      className="border-y border-white/10 bg-zinc-900/40 py-16"
      aria-labelledby="how-we-verify-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2
            id="how-we-verify-heading"
            className="mb-4 text-3xl font-semibold tracking-tight text-foreground"
          >
            How we verify tradespeople
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            We don&apos;t leave trust to chance. Every profile is checked against official
            registers; ID and insurance documents can be uploaded for manual review before we
            show those badges to homeowners.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-6 shadow-sm ring-1 ring-white/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/15">
              <Building2 className="size-6 text-sky-400" aria-hidden />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Companies House
            </h3>
            <p className="text-sm text-muted-foreground">
              At signup we search the UK Companies House register against the business name and
              record active trading status where we find a match.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-6 shadow-sm ring-1 ring-white/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <UserCheck className="size-6 text-emerald-400" aria-hidden />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">ID review</h3>
            <p className="text-sm text-muted-foreground">
              Tradespeople can upload photo ID; our team reviews documents manually. The{" "}
              <strong className="font-medium text-foreground/90">ID verified</strong> badge only
              appears after approval.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-6 shadow-sm ring-1 ring-white/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15">
              <Shield className="size-6 text-violet-400" aria-hidden />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Insurance review
            </h3>
            <p className="text-sm text-muted-foreground">
              Public liability certificates can be uploaded for review. The{" "}
              <strong className="font-medium text-foreground/90">Insured</strong> badge is shown
              only after we approve a valid policy on file.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Exclusive matching: one verified tradesperson per job — no bidding wars or spam from a
            crowd of strangers.
          </p>
          <Link
            href="/how-we-verify"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-[#FF6B35]/40 text-[#FF6B35] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]",
            )}
          >
            Read full verification guide
          </Link>
        </div>
      </div>
    </section>
  );
}
