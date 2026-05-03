import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandmarkProps {
  /** Size variant. md is default header size. lg is for hero/footer. */
  size?: "md" | "lg";
  /** Additional class names. */
  className?: string;
  /** Whether to render as a link (true) or static image (false). Default true. */
  asLink?: boolean;
}

const sizeClasses = {
  md: {
    width: 320,
    height: 88,
    containerClass:
      "h-[3.75rem] min-h-[3.75rem] w-auto max-h-[3.75rem] sm:h-16 sm:min-h-16 sm:max-h-16 md:h-[4.25rem] md:min-h-[4.25rem] md:max-h-[4.25rem]",
  },
  lg: {
    /** Footer & hero-adjacent blocks */
    width: 440,
    height: 120,
    containerClass:
      "h-28 min-h-28 w-auto sm:h-32 sm:min-h-32 md:h-36 md:min-h-36",
  },
} as const;

export function Brandmark({
  size = "md",
  className,
  asLink = true,
}: BrandmarkProps) {
  const dims = sizeClasses[size];

  const content = (
    <Image
      src="/tradescore-logo.png"
      alt="TradeScore"
      width={dims.width}
      height={dims.height}
      priority={size === "md"}
      className={cn(dims.containerClass, "object-contain", className)}
    />
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
