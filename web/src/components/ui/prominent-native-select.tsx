import type { ComponentPropsWithoutRef } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const prominentSelectClasses =
  "w-full appearance-none bg-white border-2 border-orange-500 rounded-lg px-4 py-3 pr-10 text-base font-medium text-slate-900 shadow-sm hover:border-orange-600 focus:border-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px] aria-invalid:border-destructive aria-invalid:focus:border-destructive aria-invalid:focus:ring-destructive/30 dark:bg-white";

export type ProminentNativeSelectProps =
  ComponentPropsWithoutRef<"select">;

export function ProminentNativeSelect({
  className,
  ...props
}: ProminentNativeSelectProps) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={cn(prominentSelectClasses, className)}
      />
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-600"
        aria-hidden
      />
    </div>
  );
}
