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
    width: 180,
    height: 48,
    containerClass: "h-10 sm:h-12 w-auto",
  },
  lg: {
    width: 320,
    height: 88,
    containerClass: "h-20 sm:h-24 w-auto",
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
