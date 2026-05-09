import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Lock,
  Shield,
  UserCheck,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { postJobOrangeSolidCtaClasses } from "@/lib/cta-tailwind";

export const metadata: Metadata = {
  title: "How we verify tradespeople",
  description:
    "Companies House checks, optional ID and insurance document review, exclusive matching, and privacy-first contact sharing — how TradeScore protects Glasgow homeowners.",
};

export default function HowWeVerifyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          How we verify tradespeople
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
          Transparency matters. Here&apos;s exactly what we check today — and how badges on a
          matched profile reflect reality.
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100/95">
        <div className="flex gap-2">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            <strong className="font-semibold">Honest expectation:</strong> Companies House lookup
            runs at signup. ID and insurance badges only appear after founders manually approve
            uploaded documents — many trades are still completing this step.
          </p>
        </div>
      </div>

      <div className="mb-12 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="size-8 text-sky-400" aria-hidden />
              <CardTitle>1. Companies House verification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground/90">
              When a tradesperson registers, we automatically search the UK Companies House API
              using their business name and record whether we found an active listing.
            </p>
            <p className="font-medium text-foreground">What this helps confirm</p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>There is a registered UK entity matching the name supplied</li>
              <li>Company status looks active (where data is returned)</li>
              <li>The business is traceable if issues arise</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCheck className="size-8 text-emerald-400" aria-hidden />
              <CardTitle>2. ID verification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground/90">
              Tradespeople can upload government-issued photo ID. Our team reviews each submission
              manually — there is no generic “uploaded = verified” shortcut.
            </p>
            <p className="font-medium text-foreground">Badge rule</p>
            <p>
              You&apos;ll only see an <strong className="text-foreground">ID verified</strong>{" "}
              pill after approval is recorded in our system.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="size-8 text-violet-400" aria-hidden />
              <CardTitle>3. Insurance verification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground/90">
              Public liability certificates can be uploaded for review. We check that documents look
              legitimate and note expiry dates where provided.
            </p>
            <p className="font-medium text-foreground">Badge rule</p>
            <p>
              The <strong className="text-foreground">Insured</strong> badge only renders after a
              founder approves the file — self-declared text alone isn&apos;t enough.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-10 border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="size-8 text-sky-400" aria-hidden />
            <CardTitle>Your privacy is protected</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground/90">
            We don&apos;t hand out your phone number or email to a crowd of trades bidding for
            attention.
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>Exclusive matching — one tradesperson per job</li>
            <li>Contact sharing stays controlled until they accept and pay the match fee</li>
            <li>No auction-style spam from dozens of unknown callers</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-12">
        <CardHeader>
          <CardTitle>How we compare (typical platforms)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-2 font-medium text-foreground">Signal</th>
                  <th className="px-2 py-2 text-center font-medium text-foreground">
                    TradeScore
                  </th>
                  <th className="py-2 pl-2 text-center font-medium text-muted-foreground">
                    Many directories
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/80">
                  <td className="py-3 pr-2">Companies House lookup</td>
                  <td className="px-2 py-3 text-center">
                    <CheckCircle
                      className="mx-auto size-5 text-emerald-400"
                      aria-label="Yes"
                    />
                  </td>
                  <td className="py-3 pl-2 text-center text-xs">Varies</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="py-3 pr-2">Manual ID review</td>
                  <td className="px-2 py-3 text-center">
                    <CheckCircle
                      className="mx-auto size-5 text-emerald-400"
                      aria-label="Yes"
                    />
                  </td>
                  <td className="py-3 pl-2 text-center text-xs">Often automated only</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="py-3 pr-2">Insurance document review</td>
                  <td className="px-2 py-3 text-center">
                    <CheckCircle
                      className="mx-auto size-5 text-emerald-400"
                      aria-label="Yes"
                    />
                  </td>
                  <td className="py-3 pl-2 text-center text-xs">Often self-declared</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="py-3 pr-2">Exclusive matching</td>
                  <td className="px-2 py-3 text-center">
                    <CheckCircle
                      className="mx-auto size-5 text-emerald-400"
                      aria-label="Yes"
                    />
                  </td>
                  <td className="py-3 pl-2 text-center text-xs">Rare</td>
                </tr>
                <tr>
                  <td className="py-3 pr-2">Contact privacy until commitment</td>
                  <td className="px-2 py-3 text-center">
                    <CheckCircle
                      className="mx-auto size-5 text-emerald-400"
                      aria-label="Yes"
                    />
                  </td>
                  <td className="py-3 pl-2 text-center text-xs">Often broadcast wider</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link
          href="/lead-capture"
          className={cn(postJobOrangeSolidCtaClasses, "inline-flex justify-center px-8 py-3")}
        >
          Post your job
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          Free for homeowners. No obligation until you choose to hire.
        </p>
        <Link
          href="/faq"
          className="mt-2 inline-block text-sm font-medium text-[#FF6B35] underline-offset-4 hover:underline"
        >
          Read homeowner FAQ
        </Link>
      </div>
    </div>
  );
}
