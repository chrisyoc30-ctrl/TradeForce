import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type TrustBadgePillProps = {
  label: string;
  className?: string;
};

export function TrustBadgePill({ label, className }: TrustBadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-800/30 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-300",
        className
      )}
    >
      <Check className="size-4 shrink-0 text-emerald-400" aria-hidden />
      {label}
    </span>
  );
}
