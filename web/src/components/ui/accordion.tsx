import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AccordionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Container for accordion items. Uses native <details> for accessibility and keyboard support.
 */
export function Accordion({ children, className }: AccordionProps) {
  return (
    <div
      className={cn("divide-y divide-white/10 rounded-xl border border-white/10", className)}
      role="presentation"
    >
      {children}
    </div>
  );
}

type AccordionItemProps = {
  id: string;
  question: string;
  children: React.ReactNode;
  className?: string;
};

export function AccordionItem({
  id,
  question,
  children,
  className,
}: AccordionItemProps) {
  return (
    <details
      id={id}
      className={cn(
        "group border-0 px-4 sm:px-5 open:bg-white/[0.02]",
        className
      )}
    >
      <summary
        id={`${id}-summary`}
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 py-4 pr-1 text-left text-sm font-medium text-foreground outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-[#FF6B35]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          "[&::-webkit-details-marker]:hidden"
        )}
        aria-controls={`${id}-content`}
      >
        <span className="min-w-0 flex-1">{question}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[#FF6B35] transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div
        id={`${id}-content`}
        className="border-t border-transparent pb-4 pt-0 text-sm leading-relaxed text-muted-foreground group-open:border-white/5"
        role="region"
        aria-labelledby={`${id}-summary`}
      >
        <div className="pt-3">{children}</div>
      </div>
    </details>
  );
}
