import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandmarkProps {
  /** Size variant. md is the default header size. lg is for hero/footer. */
  size?: "md" | "lg";
  /** Additional class names to apply to the link wrapper. */
  className?: string;
  /** Whether to render as a link (true) or static text (false). Default true. */
  asLink?: boolean;
}

const sizeClasses = {
  md: "text-2xl sm:text-3xl",
  lg: "text-4xl sm:text-5xl",
} as const;

export function Brandmark({
  size = "md",
  className,
  asLink = true,
}: BrandmarkProps) {
  const content = (
    <span
      className={cn(
        "font-extrabold tracking-tight leading-none",
        sizeClasses[size],
        className,
      )}
    >
      Trade<span className="text-orange-500">Score</span>
    </span>
  );

  if (!asLink) {
    return content;
  }

  return (
    <Link
      href="/"
      aria-label="TradeScore home"
      className="inline-flex items-center hover:opacity-90 transition-opacity"
    >
      {content}
    </Link>
  );
}
