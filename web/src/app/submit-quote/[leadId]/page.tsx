import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ leadId: string }> };

export const metadata = {
  title: "Submit quote | TradeScore",
};

export default async function SubmitQuotePage({ params }: Props) {
  const { leadId } = await params;
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Submit a quote</h1>
      <p className="text-sm text-muted-foreground">
        You are preparing a quote for lead{" "}
        <span className="font-mono text-foreground">{leadId}</span>. Connect your
        quoting flow or CRM here.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/lead-scoring"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "inline-flex justify-center"
          )}
        >
          Back to leads
        </Link>
      </div>
    </div>
  );
}
