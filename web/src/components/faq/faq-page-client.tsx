"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import {
  homeownerFaqs,
  tradesmanFaqs,
  type FaqItem,
} from "@/lib/faq-content";
import { cn } from "@/lib/utils";

function filterFaqs(items: FaqItem[], query: string): FaqItem[] {
  const s = query.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (item) =>
      item.question.toLowerCase().includes(s) ||
      item.answer.toLowerCase().includes(s)
  );
}

function FaqList({ items }: { items: FaqItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 bg-zinc-900/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No questions match your search. Try a shorter phrase or clear the box
        to see everything.
      </p>
    );
  }

  return (
    <Accordion className="bg-zinc-900/20">
      {items.map((item) => (
        <AccordionItem key={item.id} id={item.id} question={item.question}>
          <p className="text-pretty">{item.answer}</p>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function FaqPageClient({
  defaultTab = "homeowners",
}: {
  defaultTab?: "homeowners" | "tradesmen";
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"homeowners" | "tradesmen">(defaultTab);

  const homeowners = useMemo(
    () => filterFaqs(homeownerFaqs, query),
    [query]
  );
  const trades = useMemo(() => filterFaqs(tradesmanFaqs, query), [query]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-20 sm:px-6">
      <div className="space-y-3">
        <Label htmlFor="faq-search" className="text-foreground">
          Search questions
        </Label>
        <Input
          id="faq-search"
          type="search"
          placeholder="e.g. cost, payment, verified…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          className="border-white/15 bg-zinc-900/40"
          aria-describedby="faq-search-hint"
        />
        <p id="faq-search-hint" className="text-xs text-muted-foreground">
          Filters both homeowner and trades tabs. Clear the field to reset.
        </p>
      </div>

      <SegmentedTabs
        value={tab}
        onValueChange={(v) => setTab(v as "homeowners" | "tradesmen")}
        listClassName="border border-white/10 bg-zinc-900/50"
        items={[
          {
            value: "homeowners",
            label: "For homeowners",
            content: <FaqList items={homeowners} />,
          },
          {
            value: "tradesmen",
            label: "For tradesmen",
            content: <FaqList items={trades} />,
          },
        ]}
      />

      <section
        className="rounded-2xl border border-[#FF6B35]/25 bg-gradient-to-br from-[#FF6B35]/10 via-zinc-900/50 to-zinc-950 px-6 py-10 text-center"
        aria-labelledby="faq-cta-heading"
      >
        <h2
          id="faq-cta-heading"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          Still stuck?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Post a job for free, explore trades pricing, or jump into leads if
          you&apos;re on the tools.
        </p>
        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/lead-capture"
            className={cn(
              buttonVariants({ size: "lg" }),
              "inline-flex justify-center border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
            )}
          >
            Post a job
          </Link>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "inline-flex justify-center border-white/20 bg-white/5 hover:bg-white/10"
            )}
          >
            Join as a trade
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground hover:text-foreground"
            )}
          >
            Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
