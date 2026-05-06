import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "How you get leads | TradeScore",
  description:
    "TradeScore sends matched leads to your email. There is no public lead browsing.",
};

export default function LeadsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Matched leads only
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Leads are matched to you via email. Check your inbox for your exclusive
        matched leads.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "secondary" }), "mt-8 inline-flex")}
      >
        Back to home
      </Link>
    </div>
  );
}
