"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ProminentNativeSelect } from "@/components/ui/prominent-native-select";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";
import { UK_POSTCODE_REGEX } from "@/lib/uk-postcode";

const TRADE_OPTIONS = [
  "Plumber",
  "Electrician",
  "Joiner",
  "Builder",
  "Painter & Decorator",
  "Gas Engineer",
  "Tiler",
  "Roofer",
  "Landscaper",
  "Other",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrorKey =
  | "full_name"
  | "business_name"
  | "trade_type"
  | "phone"
  | "email"
  | "postcode";

const emptyErrors = (): Record<FieldErrorKey, string> => ({
  full_name: "",
  business_name: "",
  trade_type: "",
  phone: "",
  email: "",
  postcode: "",
});

export function TradesmanSignupForm() {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [errors, setErrors] = useState<Record<FieldErrorKey, string>>(
    emptyErrors
  );
  const [formErr, setFormErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [idCopied, setIdCopied] = useState(false);

  function validate(): boolean {
    const next = emptyErrors();
    let ok = true;
    if (!fullName.trim()) {
      next.full_name = "Enter your full name";
      ok = false;
    }
    if (!businessName.trim()) {
      next.business_name = "Enter your business name (as shown to homeowners)";
      ok = false;
    }
    if (!tradeType.trim()) {
      next.trade_type = "Select a trade type";
      ok = false;
    }
    if (!phone.trim()) {
      next.phone = "Enter your phone number";
      ok = false;
    }
    if (!email.trim()) {
      next.email = "Enter your email address";
      ok = false;
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address";
      ok = false;
    }
    if (!postcode.trim()) {
      next.postcode = "Enter the area you cover (postcode)";
      ok = false;
    } else if (!UK_POSTCODE_REGEX.test(postcode.trim())) {
      next.postcode = "Enter a valid UK postcode (e.g. G1 1AA)";
      ok = false;
    }
    setErrors(next);
    return ok;
  }

  if (successId) {
    return (
      <div
        className="space-y-4 rounded-lg border border-[#FF6B35]/30 bg-zinc-950/60 p-6"
        role="status"
        aria-live="polite"
      >
        <p className="text-lg font-semibold text-foreground">
          You&apos;re registered — welcome to TradeScore
        </p>
        <p className="text-sm text-muted-foreground">Your tradesperson ID</p>
        <div className="space-y-3 rounded-md border border-white/10 bg-zinc-900 px-4 py-5 text-center">
          <code className="block break-all text-3xl font-mono font-bold leading-tight tracking-tight text-[#FF6B35] sm:text-4xl">
            {successId}
          </code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(successId);
                setIdCopied(true);
                window.setTimeout(() => setIdCopied(false), 2000);
              } catch {
                setIdCopied(false);
              }
            }}
          >
            {idCopied ? (
              <>
                <Check className="mr-1.5 size-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 size-4" />
                Copy ID
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground/90">Copy and save it somewhere safe</span> — you
          will need it to open{" "}
          <Link className="underline" href="/available-jobs">
            Available jobs
          </Link>{" "}
          and place bids.
        </p>
        <Link
          href="/available-jobs"
          className={cn(
            buttonVariants({ size: "lg" }),
            "inline-flex w-full justify-center border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d] sm:w-auto"
          )}
        >
          Go to available jobs
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setFormErr(null);
        if (!validate()) return;
        const base = getPublicApiBaseUrl();
        if (!base) {
          setFormErr("NEXT_PUBLIC_API_URL is not configured.");
          return;
        }
        setPending(true);
        try {
          const res = await fetch(`${base}/api/tradesman-signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: fullName.trim(),
              business_name: businessName.trim() || null,
              trade_type: tradeType,
              phone: phone.trim(),
              email: email.trim(),
              postcode: postcode.trim().toUpperCase(),
            }),
          });
          const j = (await res.json().catch(() => ({}))) as {
            error?: string;
            success?: boolean;
            tradesperson_id?: string;
          };
          if (res.status === 409) {
            setFormErr(
              j.error ?? "An account with this email already exists"
            );
            return;
          }
          if (!res.ok) {
            setFormErr(j.error ?? "Registration failed");
            return;
          }
          if (j.success && j.tradesperson_id) {
            setSuccessId(j.tradesperson_id);
            return;
          }
          setFormErr("Unexpected response from server");
        } catch {
          setFormErr("Network error — try again.");
        } finally {
          setPending(false);
        }
      }}
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="ts-full">Full name *</Label>
        <Input
          id="ts-full"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          disabled={pending}
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={errors.full_name ? "ts-full-err" : undefined}
        />
        {errors.full_name ? (
          <p id="ts-full-err" className="text-sm text-destructive" role="alert">
            {errors.full_name}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-biz">Business name *</Label>
        <Input
          id="ts-biz"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          autoComplete="organization"
          disabled={pending}
          aria-invalid={Boolean(errors.business_name)}
          aria-describedby={errors.business_name ? "ts-biz-err" : undefined}
        />
        {errors.business_name ? (
          <p id="ts-biz-err" className="text-sm text-destructive" role="alert">
            {errors.business_name}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-trade">Trade type *</Label>
        <ProminentNativeSelect
          id="ts-trade"
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value)}
          disabled={pending}
          aria-invalid={Boolean(errors.trade_type)}
          aria-describedby={errors.trade_type ? "ts-trade-err" : undefined}
        >
          <option value="">Select trade</option>
          {TRADE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </ProminentNativeSelect>
        {errors.trade_type ? (
          <p
            id="ts-trade-err"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.trade_type}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-phone">Phone number *</Label>
        <Input
          id="ts-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          disabled={pending}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "ts-phone-err" : undefined}
        />
        {errors.phone ? (
          <p
            id="ts-phone-err"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.phone}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-email">Email address *</Label>
        <Input
          id="ts-email"
          type="text"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={pending}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "ts-email-err" : undefined}
        />
        {errors.email ? (
          <p
            id="ts-email-err"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.email}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-post">Area you cover (postcode) *</Label>
        <Input
          id="ts-post"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.toUpperCase())}
          autoComplete="postal-code"
          disabled={pending}
          placeholder="e.g. G1 1AA"
          aria-invalid={Boolean(errors.postcode)}
          aria-describedby={errors.postcode ? "ts-post-err" : undefined}
        />
        {errors.postcode ? (
          <p
            id="ts-post-err"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.postcode}
          </p>
        ) : null}
      </div>
      {formErr ? (
        <p className="text-sm text-destructive" role="alert">
          {formErr}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="inline-flex w-full min-h-[56px] items-center justify-center border-2 border-orange-500 bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-orange-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
            Registering…
          </>
        ) : (
          "Register"
        )}
      </Button>
    </form>
  );
}
