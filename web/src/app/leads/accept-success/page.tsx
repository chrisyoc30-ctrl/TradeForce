import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Lead accepted | TradeScore",
  description: "Your lead acceptance was successful",
};

type SearchParams = Promise<{
  free?: string;
  unlimited?: string;
  leadId?: string;
}>;

export default async function AcceptSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const isFree = sp?.free === "true";
  const isUnlimited = sp?.unlimited === "true";

  const headline = isFree
    ? "Your first lead is FREE"
    : isUnlimited
      ? "Lead accepted — included in your subscription"
      : "Payment successful — lead accepted";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">{headline}</h1>
      {isFree ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Your first lead is <strong className="text-foreground">FREE</strong> — we&apos;ve sent
          the homeowner&apos;s contact details to your email. No payment was taken. From your next
          accepted lead onwards, the £25 fee applies on checkout unless you&apos;re on TradeScore
          Unlimited.
        </p>
      ) : isUnlimited ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Thanks — this acceptance is{" "}
          <strong className="text-foreground">included in Unlimited</strong>, so Stripe did not charge
          a per-lead fee. The homeowner&apos;s details are unlocked in your dashboard. Reach out
          within 24 hours to maximise your chance of winning the job.
        </p>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Thanks for accepting this lead via TradeScore. The homeowner&apos;s contact details are
          now in your dashboard. Reach out within 24 hours to maximise your chance of winning the
          job.
        </p>
      )}
      <Link
        href="/lead-scoring"
        className={cn(
          buttonVariants(),
          "mt-8 inline-flex bg-orange-500 hover:bg-orange-600",
        )}
      >
        Back to available leads
      </Link>
    </div>
  );
}
