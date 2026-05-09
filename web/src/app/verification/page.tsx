"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";
import { cn } from "@/lib/utils";

const TS_ID_KEY = "tradescore-tradesperson-id";

type VerificationPayload = {
  verification_status?: string;
  verification_badges?: string[];
  id_proof?: {
    status?: string;
    uploaded_at?: string | null;
    file_name?: string | null;
    rejection_reason?: string | null;
  };
  insurance?: {
    status?: string;
    uploaded_at?: string | null;
    file_name?: string | null;
    expiry_date?: string | null;
    rejection_reason?: string | null;
  };
};

export default function VerificationPage() {
  const [tradespersonId, setTradespersonId] = useState("");
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchVerificationStatus = async (id: string) => {
    const base = getPublicApiBaseUrl();
    if (!base || !id.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${base}/api/tradesperson/${encodeURIComponent(id.trim())}/verification-status`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as VerificationPayload & {
        error?: string;
      };
      if (!response.ok) {
        setVerificationStatus(null);
        setMessage({
          type: "error",
          text: data.error ?? "Could not load verification status.",
        });
        return;
      }
      setVerificationStatus(data);
    } catch {
      setVerificationStatus(null);
      setMessage({
        type: "error",
        text: "Could not load verification status.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = (window.localStorage.getItem(TS_ID_KEY) ?? "").trim();
    setTradespersonId(id);
    if (id) void fetchVerificationStatus(id);
    else setLoading(false);
  }, []);

  const handleFileUpload = async (
    documentType: "id_proof" | "insurance",
    file: File,
  ) => {
    const base = getPublicApiBaseUrl();
    const id = tradespersonId.trim();
    if (!file || !base || !id) {
      setMessage({
        type: "error",
        text: !base
          ? "NEXT_PUBLIC_API_URL is not configured."
          : !id
            ? "Save your tradesperson ID from Available jobs first."
            : "Choose a file to upload.",
      });
      return;
    }
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);
    if (documentType === "insurance" && insuranceExpiry.trim()) {
      formData.append("expiry_date", insuranceExpiry.trim());
    }
    try {
      const response = await fetch(
        `${base}/api/tradesperson/${encodeURIComponent(id)}/upload-verification`,
        { method: "POST", body: formData },
      );
      const data = (await response.json()) as { error?: string };
      if (response.ok) {
        setMessage({
          type: "success",
          text:
            documentType === "id_proof"
              ? "ID uploaded — pending review (usually 24–48 hours)."
              : "Insurance uploaded — pending review (usually 24–48 hours).",
        });
        await fetchVerificationStatus(id);
      } else {
        setMessage({
          type: "error",
          text: data.error ?? "Upload failed.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed. Please try again." });
    }
    setUploading(false);
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center text-amber-600 dark:text-amber-400">
            <Clock className="mr-1 h-4 w-4" /> Pending review
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center text-red-600 dark:text-red-400">
            <XCircle className="mr-1 h-4 w-4" /> Rejected
          </span>
        );
      default:
        return <span className="text-muted-foreground">Not uploaded</span>;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-muted-foreground">
        Loading verification status…
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/available-jobs"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Available jobs
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Verification documents
          </h1>
          <p className="mt-1 text-muted-foreground">
            Upload ID and insurance to earn trust badges shown to homeowners.
            Leads are not blocked while documents are pending.
          </p>
        </div>
      </div>

      {!tradespersonId.trim() ? (
        <div
          role="status"
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
        >
          Enter your tradesperson ID on{" "}
          <Link href="/available-jobs" className="font-medium underline">
            Available jobs
          </Link>{" "}
          first — we use it to attach uploads to your account.
        </div>
      ) : null}

      {message ? (
        <div
          role="alert"
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-sm",
            message.type === "success"
              ? "border-green-500/40 bg-green-500/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {message.text}
        </div>
      ) : null}

      {verificationStatus ? (
        <div className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            Overall:{" "}
            {(verificationStatus.verification_status ?? "unverified").replace(
              /_/g,
              " ",
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(verificationStatus.verification_badges ?? []).map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-secondary px-3 py-1 text-sm capitalize text-secondary-foreground"
              >
                {badge.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Photo ID</CardTitle>
            <CardDescription>
              Clear photo of driving licence, passport, or national ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="id-upload">
                Status:{" "}
                {verificationStatus
                  ? getStatusBadge(verificationStatus.id_proof?.status)
                  : null}
              </Label>
              {verificationStatus?.id_proof?.file_name ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  File: {verificationStatus.id_proof.file_name}
                </p>
              ) : null}
              {verificationStatus?.id_proof?.rejection_reason ? (
                <p className="mt-1 text-sm text-destructive">
                  Reason: {verificationStatus.id_proof.rejection_reason}
                </p>
              ) : null}
            </div>
            <div>
              <Input
                id="id-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading || !tradespersonId.trim()}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload("id_proof", file);
                  e.target.value = "";
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, or PNG — max 5MB.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public liability insurance</CardTitle>
            <CardDescription>
              Current certificate (PDF or photo). Expiry date optional but
              helpful.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid max-w-xs gap-2">
              <Label htmlFor="ins-expiry">Policy expiry (optional)</Label>
              <Input
                id="ins-expiry"
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
                disabled={uploading || !tradespersonId.trim()}
              />
            </div>
            <div>
              <Label htmlFor="insurance-upload">
                Status:{" "}
                {verificationStatus
                  ? getStatusBadge(verificationStatus.insurance?.status)
                  : null}
              </Label>
              {verificationStatus?.insurance?.file_name ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  File: {verificationStatus.insurance.file_name}
                </p>
              ) : null}
              {verificationStatus?.insurance?.expiry_date ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Expires: {verificationStatus.insurance.expiry_date}
                </p>
              ) : null}
              {verificationStatus?.insurance?.rejection_reason ? (
                <p className="mt-1 text-sm text-destructive">
                  Reason: {verificationStatus.insurance.rejection_reason}
                </p>
              ) : null}
            </div>
            <div>
              <Input
                id="insurance-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading || !tradespersonId.trim()}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload("insurance", file);
                  e.target.value = "";
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, or PNG — max 5MB.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h3 className="mb-2 font-semibold">Why verify?</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Builds trust with homeowners viewing your match.</li>
          <li>Shows you run a professional operation.</li>
          <li>Non-blocking: you can still receive leads while pending.</li>
          <li>Review typically within 24–48 hours.</li>
        </ul>
      </div>
    </div>
  );
}
