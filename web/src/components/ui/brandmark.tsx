import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandmarkProps {
  /** Size variant. md (header) and lg (footer) use the same logo dimensions. */
  size?: "md" | "lg";
  /** Additional class names. */
  className?: string;
  /** Whether to render as a link (true) or static image (false). Default true. */
  asLink?: boolean;
}

/** Header and footer share the same logo scale for consistent branding. */
const brandmarkLogoSize = {
  width: 440,
  height: 120,
  containerClass:
    "h-28 min-h-28 w-auto sm:h-32 sm:min-h-32 md:h-36 md:min-h-36",
} as const;

const sizeClasses = {
  md: brandmarkLogoSize,
  lg: brandmarkLogoSize,
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
