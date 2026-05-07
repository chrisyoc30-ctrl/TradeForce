import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Lead accepted | TradeScore",
  description: "Your lead acceptance was successful",
};

type SearchParams = Promise<{ free?: string; leadId?: string }>;

export default async function AcceptSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const isFree = sp?.free === "true";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isFree ? "First lead unlocked — free" : "Payment received — lead unlocked!"}
      </h1>
      {isFree ? (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Your first lead is <strong className="text-foreground">FREE</strong> —
          we&apos;ve sent the homeowner&apos;s contact details to your email. No payment
          was taken. From your next accepted lead onwards, the £25 fee applies on
          checkout.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Thanks for accepting this lead via TradeScore. The homeowner&apos;s contact
          details are now in your dashboard. Reach out within 24 hours to maximize
          your chance of winning the job.
        </p>
      )}
      <Link
        href="/lead-scoring"
        className={cn(
          buttonVariants(),
          "mt-8 inline-flex bg-orange-500 hover:bg-orange-600"
        )}
      >
        Back to available leads
      </Link>
    </div>
  );
}
