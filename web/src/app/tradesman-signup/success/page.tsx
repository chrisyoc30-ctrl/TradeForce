import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "You’re on the list",
  description: "Tradesman registration received — we’ll be in touch.",
};

export default function TradesmanSignupSuccessPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">You&apos;re on the list</h1>
      <p className="text-muted-foreground">
        We&apos;ll be in touch when leads matching your trade and area come in.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants(), "inline-flex justify-center")}
      >
        Back to home
      </Link>
    </div>
  );
}
