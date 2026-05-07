import Link from "next/link";

import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TRADESMAN_LEAD_PRICE_GBP, TRADESMAN_UNLIMITED_MONTHLY_GBP } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const UNLIMITED_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_CHECKOUT_URL?.trim() || "";

export const metadata = {
  title: "Pricing | TradeScore",
  description:
    "Pay-per-lead or unlimited subscription for Glasgow tradespeople. Homeowners stay free.",
};

function TierBullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
      {items.map((t) => (
        <li key={t} className="flex gap-2 leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/90" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-linear-to-b from-slate-950 via-slate-900 to-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:py-18">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400/85">
            Tradespeople
          </p>
          <h1 className="mt-3 text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Pricing that fits how you grow
          </h1>
          <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
            Pay per lead, or unlock unlimited with one monthly price. Exclusive matching —
            every lead goes to exactly one verified tradesperson.
          </p>
        </header>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <Card
            className={cn(
              "border-slate-700/70 bg-card/95 ring-2 ring-transparent shadow-lg shadow-black/20",
              "backdrop-blur-sm",
            )}
          >
            <CardHeader className="border-b border-border/70 bg-muted/15 pb-4">
              <CardTitle className="text-lg text-foreground">Pay per lead</CardTitle>
              <CardDescription className="text-base font-medium text-foreground/95">
                £{TRADESMAN_LEAD_PRICE_GBP} per lead • first lead free
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6">
              <TierBullets
                items={[
                  "£25 per lead when you choose to unlock a job",
                  "First lead FREE",
                  "Pay only for leads you want",
                  "No monthly commitment",
                  "Best for: roughly 1–8 leads/month",
                ]}
              />
            </CardContent>
            <CardFooter>
              <Link
                href="/tradesman-signup"
                className={cn(
                  buttonVariants({ size: "default" }),
                  "w-full justify-center bg-slate-200 text-slate-950 hover:bg-white",
                )}
              >
                Get Started →
              </Link>
            </CardFooter>
          </Card>

          <Card
            className={cn(
              "border-amber-500/55 bg-linear-to-br from-card via-card to-slate-900/85",
              "ring-2 ring-amber-500/55 shadow-xl shadow-amber-950/20",
            )}
          >
            <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Unlimited
            </div>
            <CardHeader className="border-b border-amber-500/15 pb-4">
              <CardTitle className="text-lg">Unlimited</CardTitle>
              <CardDescription className="text-base font-semibold text-foreground/95">
                £{TRADESMAN_UNLIMITED_MONTHLY_GBP}/month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6">
              <TierBullets
                items={[
                  "£99/month subscription",
                  "Unlimited lead unlocks",
                  "No per-lead charges on included leads",
                  "Cancel anytime",
                  "Best for: general contractors and high-volume trades (10+ leads)",
                ]}
              />
            </CardContent>
            <CardFooter>
              {UNLIMITED_CHECKOUT_URL ? (
                <Link
                  href={UNLIMITED_CHECKOUT_URL}
                  className={cn(
                    buttonVariants({ size: "default" }),
                    "w-full justify-center bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400",
                  )}
                >
                  Subscribe →
                </Link>
              ) : (
                <div className="w-full rounded-lg border border-dashed border-amber-500/35 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                  <p>
                    Stripe subscription checkout URL is not set yet. Configure{" "}
                    <code className="rounded bg-muted px-1 py-px text-[10px] text-foreground/90">
                      NEXT_PUBLIC_STRIPE_UNLIMITED_CHECKOUT_URL
                    </code>{" "}
                    for the live subscribe button.
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>

        <p className="mx-auto mt-10 max-w-2xl rounded-xl border border-slate-700/45 bg-muted/25 px-4 py-3 text-center text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">Homeowners:</strong> always free to
          post work — TradeScore earns from tradespeople, not homeowners.
        </p>

        <section className="mx-auto mt-16 max-w-2xl space-y-3">
          <h2 className="text-center font-heading text-lg font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <Accordion className="border-border/70 bg-muted/10">
            <AccordionItem id="faq-switch" question="Can I switch between pay-per-lead and Unlimited?">
              <div className="px-5 pb-4 text-sm text-muted-foreground">
                Yes. You can start on pay-per-lead and subscribe to Unlimited anytime from your
                TradeScore dashboard. If you cancel Unlimited, you return to £25-per-lead
                billing (your first-lead-free offer still applies according to policy).
              </div>
            </AccordionItem>
            <AccordionItem id="faq-cancel" question="How do I cancel Unlimited?">
              <div className="px-5 pb-4 text-sm text-muted-foreground">
                Open the Subscription page signed in with your saved tradesperson ID and use
                cancel. You retain access until the end of your paid period depending on Stripe
                settings; cancellations are synced from Stripe automatically.
              </div>
            </AccordionItem>
            <AccordionItem id="faq-bill" question="How does billing work?">
              <div className="px-5 pb-4 text-sm text-muted-foreground">
                Pay-per-lead charges run through Stripe when you accept a lead (£25 each, first
                lead free). Unlimited is charged monthly via Stripe Billing. Failed invoices may
                mark your subscription past due until resolved.
              </div>
            </AccordionItem>
          </Accordion>
        </section>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href="/lead-capture" className={cn(buttonVariants({ variant: "outline" }))}>
            Post a job (free)
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
