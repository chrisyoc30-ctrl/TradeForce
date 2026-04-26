"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const accent = "#FF6B35";

export function HomeHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
          aria-label="TradeScore home"
        >
          Trade<span style={{ color: accent }}>Score</span>
        </Link>
        <nav
          className="hidden min-w-0 flex-1 justify-center gap-4 px-2 text-sm text-muted-foreground md:flex md:gap-6"
          aria-label="Primary"
        >
          <Link
            href="/pricing"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/faq"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
        </nav>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link
            href="/lead-capture"
            className={cn(
              buttonVariants({ size: "sm" }),
              "border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
            )}
          >
            Post a job
          </Link>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/20"
            )}
          >
            For tradespeople
          </Link>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
      {open ? (
        <div
          id="mobile-nav"
          className="border-b border-white/5 bg-zinc-950/95 px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-3 text-sm" aria-label="Primary mobile">
            <Link
              href="/pricing"
              className="text-foreground/90"
              onClick={() => setOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/faq"
              className="text-foreground/90"
              onClick={() => setOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/lead-capture"
              className={cn(
                buttonVariants({ size: "sm" }),
                "w-full border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
              )}
              onClick={() => setOpen(false)}
            >
              Post a job
            </Link>
            <Link
              href="/tradesman-signup"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full border-white/20"
              )}
              onClick={() => setOpen(false)}
            >
              For tradespeople
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
