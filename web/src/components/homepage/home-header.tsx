"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { clearHomeownerSession, getLoginUrl } from "@/lib/auth-nav";
import { cn } from "@/lib/utils";

const accent = "#FF6B35";

function maskSavedPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length < 4) return "Homeowner account";
  return `•••• ${d.slice(-4)}`;
}

type AuthBarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  user: ReturnType<typeof useAuth>["user"];
  sessionActive: boolean;
};

function AccountOrSignInBar({
  mobile,
  onNavigate,
  user,
  sessionActive,
}: AuthBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function down(ev: MouseEvent) {
      if (wrapRef.current?.contains(ev.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [menuOpen]);

  if (sessionActive && user?.phone) {
    return (
      <div ref={wrapRef} className={mobile ? "w-full" : "relative"}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "border-white/20 bg-white/5 font-medium hover:bg-white/10",
            mobile && "w-full justify-between"
          )}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={cn("truncate", mobile ? "flex-1 text-left" : "max-w-[9rem]")}>
            {maskSavedPhone(user.phone)}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-80" aria-hidden />
        </Button>
        {menuOpen ? (
          <div
            className={cn(
              "absolute z-[60] mt-2 rounded-lg border border-white/15 bg-zinc-900 py-1 shadow-xl shadow-black/40",
              mobile ? "right-0 left-0 min-w-[10rem]" : "right-0 min-w-[12rem]"
            )}
            role="menu"
          >
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-white/10",
                mobile && "w-full"
              )}
              onClick={() => {
                clearHomeownerSession();
                setMenuOpen(false);
                onNavigate?.();
              }}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const href = getLoginUrl();

  if (mobile) {
    return (
      <Link
        href={href}
        className="text-foreground/90 hover:text-foreground"
        onClick={() => {
          onNavigate?.();
        }}
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "font-medium text-foreground hover:bg-white/10"
      )}
      onClick={() => {
        onNavigate?.();
      }}
    >
      Sign in
    </Link>
  );
}

export function HomeHeader() {
  const auth = useAuth();
  const { user, loading, isAuthenticated } = auth;

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

  const sessionActive = !loading && isAuthenticated;

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
          <AccountOrSignInBar
            user={user}
            sessionActive={sessionActive}
          />
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
            <AccountOrSignInBar
              mobile
              user={user}
              sessionActive={sessionActive}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      ) : null}
    </header>
  );
}
