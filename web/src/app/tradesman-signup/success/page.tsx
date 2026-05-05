import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { serviceAreaCodesToShortLabels } from "@/lib/trade-types";

export const metadata = {
  title: "You’re on the list",
  description: "Tradesman registration received — we’ll be in touch.",
};

type SearchParams = Promise<{ areas?: string | string[] | undefined }>;

export default async function TradesmanSignupSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const raw = sp?.areas;
  const param =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  const codes = param
    ? param
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    : [];
  const labels = serviceAreaCodesToShortLabels(codes);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">You&apos;re on the list</h1>
      <p className="text-muted-foreground">
        We&apos;ll be in touch when leads matching your trade and area come in.
      </p>
      {labels.length > 0 ? (
        <p className="text-foreground/90 text-sm sm:text-base">
          You&apos;ll be matched to leads in:{" "}
          <span className="font-medium">{labels.join(", ")}</span>
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          If you just registered on the signup form, your chosen service areas were
          confirmed on the same page as your tradesperson ID.
        </p>
      )}
      <Link
        href="/"
        className={cn(buttonVariants(), "inline-flex justify-center")}
      >
        Back to home
      </Link>
    </div>
  );
}
