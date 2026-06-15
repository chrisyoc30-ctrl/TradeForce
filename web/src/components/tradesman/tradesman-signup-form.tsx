"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ProminentNativeSelect } from "@/components/ui/prominent-native-select";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";
import {
  extractPostcodeArea,
  POSTCODE_AREAS,
  serviceAreaCodesToShortLabels,
  TRADE_TYPES,
} from "@/lib/trade-types";
import { UK_POSTCODE_REGEX } from "@/lib/uk-postcode";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrorKey =
  | "full_name"
  | "business_name"
  | "trade_type"
  | "phone"
  | "email"
  | "postcode"
  | "service_areas";

const emptyErrors = (): Record<FieldErrorKey, string> => ({
  full_name: "",
  business_name: "",
  trade_type: "",
  phone: "",
  email: "",
  postcode: "",
  service_areas: "",
});

type SignupSuccessVerification = {
  verified: boolean;
  companyName: string | null;
};

export function TradesmanSignupForm() {
  const postcodeAreaRef = useRef<string>("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [businessStructure, setBusinessStructure] = useState<
    "sole_trader" | "limited_company" | "partnership" | ""
  >("");
  const [companiesHouseNumber, setCompaniesHouseNumber] = useState("");
  const [utrReference, setUtrReference] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [customerFacingBio, setCustomerFacingBio] = useState("");
  const [publicLiabilityPolicyRef, setPublicLiabilityPolicyRef] = useState("");
  const [gasSafeRegistration, setGasSafeRegistration] = useState("");
  const [errors, setErrors] = useState<Record<FieldErrorKey, string>>(
    emptyErrors
  );
  const [formErr, setFormErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [chVerification, setChVerification] =
    useState<SignupSuccessVerification | null>(null);
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
      next.postcode = "Enter your main base postcode";
      ok = false;
    } else if (!UK_POSTCODE_REGEX.test(postcode.trim())) {
      next.postcode = "Enter a valid UK postcode (e.g. G1 1AA)";
      ok = false;
    }
    if (serviceAreas.length === 0) {
      next.service_areas =
        "Select at least one area you travel to for work";
      ok = false;
    }
    setErrors(next);
    return ok;
  }

  function toggleServiceArea(code: string) {
    setServiceAreas((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  const areaOrder = new Map(
    POSTCODE_AREAS.map((a, i) => [a.code, i] as const)
  );
  function orderedServiceAreas(codes: string[]) {
    return [...codes].sort(
      (a, b) =>
        (areaOrder.get(a as (typeof POSTCODE_AREAS)[number]["code"]) ??
          999) -
        (areaOrder.get(b as (typeof POSTCODE_AREAS)[number]["code"]) ?? 999)
    );
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
        {serviceAreas.length > 0 ? (
          <p className="text-sm text-foreground/90">
            You&apos;ll be matched to leads in:{" "}
            <span className="font-medium">
              {serviceAreaCodesToShortLabels(orderedServiceAreas(serviceAreas)).join(
                ", "
              )}
            </span>
          </p>
        ) : null}
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
        {chVerification?.verified ? (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-600/60 dark:bg-amber-950/40">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Companies House name match found — pending platform review
            </p>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/90">
              Matched to{" "}
              {(chVerification.companyName ?? "").trim() || "your business"} on
              the UK Companies House register.
            </p>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/90">
              Platform verification requires completing{" "}
              <Link className="underline" href="/verify">
                tradescore.uk/verify
              </Link>{" "}
              — our team reviews your documents before customer-facing badges are
              granted.
            </p>
          </div>
        ) : null}
        {chVerification && chVerification.verified === false ? (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-600/60 dark:bg-amber-950/40">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              No Companies House name match found at signup
            </p>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/90">
              Account created — complete{" "}
              <Link className="underline" href="/verify">
                tradescore.uk/verify
              </Link>{" "}
              to become eligible for lead matching.
            </p>
          </div>
        ) : null}
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
          const sortedAreas = orderedServiceAreas(serviceAreas);
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
              service_areas: sortedAreas,
              sms_opt_in: smsOptIn,
              business_structure: businessStructure || undefined,
              companies_house_number: companiesHouseNumber.trim() || undefined,
              utr_reference: utrReference.trim() || undefined,
              years_experience: yearsExperience
                ? parseInt(yearsExperience, 10)
                : undefined,
              customer_facing_bio: customerFacingBio.trim() || undefined,
              public_liability_policy_ref:
                publicLiabilityPolicyRef.trim() || undefined,
              gas_safe_registration: gasSafeRegistration.trim() || undefined,
            }),
          });
          const j = (await res.json().catch(() => ({}))) as {
            error?: string;
            success?: boolean;
            tradesperson_id?: string;
            ch_verified?: boolean;
            ch_company_name?: string | null;
            ch_company_number?: string | null;
            ch_company_status?: string | null;
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
            if (j.ch_verified === true) {
              setChVerification({
                verified: true,
                companyName:
                  typeof j.ch_company_name === "string"
                    ? j.ch_company_name
                    : null,
              });
            } else if (j.ch_verified === false) {
              setChVerification({ verified: false, companyName: null });
            } else {
              setChVerification(null);
            }
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
          {TRADE_TYPES.map((t) => (
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
        <Label htmlFor="ts-post">Primary postcode (main base) *</Label>
        <Input
          id="ts-post"
          value={postcode}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            setPostcode(value);
            const nextArea = extractPostcodeArea(value);
            if (!value.trim()) {
              postcodeAreaRef.current = "";
              return;
            }
            if (
              nextArea &&
              nextArea !== postcodeAreaRef.current
            ) {
              postcodeAreaRef.current = nextArea;
              setServiceAreas((s) =>
                s.includes(nextArea) ? s : [...s, nextArea]
              );
            }
          }}
          autoComplete="postal-code"
          disabled={pending}
          placeholder="e.g. G43 2DZ"
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
      <div className="grid gap-2">
        <div>
          <Label>Service areas — where do you cover? *</Label>
          <p
            id="ts-areas-hint"
            className="mt-1 text-sm text-muted-foreground"
          >
            Tick all postcode areas you&apos;d travel to for work. We&apos;ll only
            match you to leads inside these areas.
          </p>
        </div>
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          role="group"
          aria-label="Service postcode areas"
          aria-describedby={
            errors.service_areas ? "ts-areas-err" : "ts-areas-hint"
          }
        >
          {POSTCODE_AREAS.map(({ code, label }) => (
            <label
              key={code}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-white/10 bg-zinc-950/40 px-2 py-2 text-sm hover:bg-zinc-900/80"
            >
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 rounded border-white/20 accent-[#FF6B35]"
                checked={serviceAreas.includes(code)}
                onChange={() => toggleServiceArea(code)}
                disabled={pending}
              />
              <span className="leading-tight">{label}</span>
            </label>
          ))}
        </div>
        {errors.service_areas ? (
          <p
            id="ts-areas-err"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.service_areas}
          </p>
        ) : null}
      </div>
      {formErr ? (
        <p className="text-sm text-destructive" role="alert">
          {formErr}
        </p>
      ) : null}
      <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
        <div>
          <h3 className="text-lg font-semibold">Verification details</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Help us verify your business — this builds trust with customers.
            All fields in this section are optional.
          </p>
        </div>

        <fieldset className="grid gap-2" disabled={pending}>
          <legend className="text-sm font-medium">Business structure</legend>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="business_structure"
                value="sole_trader"
                checked={businessStructure === "sole_trader"}
                onChange={() => setBusinessStructure("sole_trader")}
                disabled={pending}
                className="size-4 shrink-0 accent-[#FF6B35]"
              />
              <span>Sole Trader</span>
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="business_structure"
                value="limited_company"
                checked={businessStructure === "limited_company"}
                onChange={() => setBusinessStructure("limited_company")}
                disabled={pending}
                className="size-4 shrink-0 accent-[#FF6B35]"
              />
              <span>Limited Company</span>
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="business_structure"
                value="partnership"
                checked={businessStructure === "partnership"}
                onChange={() => setBusinessStructure("partnership")}
                disabled={pending}
                className="size-4 shrink-0 accent-[#FF6B35]"
              />
              <span>Partnership</span>
            </label>
          </div>
        </fieldset>

        {businessStructure === "limited_company" ? (
          <div className="grid gap-2">
            <Label htmlFor="companies_house_number">
              Companies House registration number
            </Label>
            <Input
              id="companies_house_number"
              value={companiesHouseNumber}
              onChange={(e) =>
                setCompaniesHouseNumber(e.target.value.toUpperCase())
              }
              disabled={pending}
              placeholder="e.g. SC123456"
              maxLength={8}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              8 characters. Look up on companieshouse.gov.uk
            </p>
          </div>
        ) : null}

        {businessStructure === "sole_trader" ? (
          <div className="grid gap-2">
            <Label htmlFor="utr_reference">
              Unique Taxpayer Reference (UTR) — optional
            </Label>
            <Input
              id="utr_reference"
              value={utrReference}
              onChange={(e) =>
                setUtrReference(e.target.value.replace(/\D/g, ""))
              }
              disabled={pending}
              placeholder="10 digits from HMRC"
              maxLength={10}
              inputMode="numeric"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Found on HMRC self-assessment letters. Optional but speeds
              verification.
            </p>
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="years_experience">
            Years experience in your trade
          </Label>
          <Input
            id="years_experience"
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            disabled={pending}
            min={0}
            max={70}
            placeholder="e.g. 12"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="customer_facing_bio">
            Short bio for customers (optional)
          </Label>
          <textarea
            id="customer_facing_bio"
            value={customerFacingBio}
            onChange={(e) =>
              setCustomerFacingBio(e.target.value.slice(0, 200))
            }
            disabled={pending}
            rows={3}
            maxLength={200}
            placeholder="e.g. Glasgow-based painter with 12 years experience specializing in domestic interiors..."
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            {customerFacingBio.length}/200 characters. Shown to matched
            customers.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="public_liability_policy_ref">
            Public liability insurance policy reference (optional)
          </Label>
          <Input
            id="public_liability_policy_ref"
            value={publicLiabilityPolicyRef}
            onChange={(e) => setPublicLiabilityPolicyRef(e.target.value)}
            disabled={pending}
            placeholder="Policy number from your insurer"
            maxLength={100}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll email you to request the certificate after signup. £2m
            minimum required for verified badge.
          </p>
        </div>

        {tradeType === "Gas Engineer" ? (
          <div className="grid gap-2">
            <Label htmlFor="gas_safe_registration">
              Gas Safe Register number
            </Label>
            <Input
              id="gas_safe_registration"
              value={gasSafeRegistration}
              onChange={(e) =>
                setGasSafeRegistration(e.target.value.replace(/\D/g, ""))
              }
              disabled={pending}
              placeholder="e.g. 638153"
              maxLength={10}
              inputMode="numeric"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Verified at gassaferegister.co.uk
            </p>
          </div>
        ) : null}
      </div>
      <div className="my-4 flex items-start gap-2">
        <input
          type="checkbox"
          id="sms_opt_in"
          name="sms_opt_in"
          checked={smsOptIn}
          onChange={(e) => setSmsOptIn(e.target.checked)}
          disabled={pending}
          className="mt-1 size-4 shrink-0 rounded border-border"
        />
        <label
          htmlFor="sms_opt_in"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          Send me SMS alerts when I&apos;m matched to a lead. Standard rates may
          apply. Reply STOP to opt out anytime. See our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </label>
      </div>
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
