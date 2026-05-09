"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";

type PendingTrade = {
  id?: string;
  business_name?: string;
  contact_email?: string;
  signup_date?: string;
  id_proof_status?: string;
  id_proof_file?: string | null;
  insurance_status?: string;
  insurance_file?: string | null;
};

function fileBasename(path: string | null | undefined): string {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/");
  const seg = normalized.split("/").filter(Boolean);
  return seg[seg.length - 1] ?? "";
}

export default function AdminVerificationPage() {
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<
    (PendingTrade & { docType?: "id_proof" | "insurance" }) | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPendingVerifications = async () => {
    try {
      const response = await fetch("/api/admin/verification/pending");
      const data = (await response.json()) as {
        trades?: PendingTrade[];
        pending_count?: number;
        error?: string;
      };
      if (!response.ok) {
        console.error(data.error ?? response.statusText);
        setPendingTrades([]);
        setPendingCount(0);
        return;
      }
      setPendingTrades(data.trades ?? []);
      setPendingCount(
        typeof data.pending_count === "number"
          ? data.pending_count
          : (data.trades ?? []).length,
      );
    } catch (e) {
      console.error(e);
      setPendingTrades([]);
      setPendingCount(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchPendingVerifications();
  }, []);

  const handleReview = async (
    tradeId: string,
    documentType: "id_proof" | "insurance",
    action: "approve" | "reject",
  ) => {
    try {
      const response = await fetch("/api/admin/verification/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade_id: tradeId,
          document_type: documentType,
          action,
          rejection_reason:
            action === "reject" ? rejectionReason.trim() : undefined,
        }),
      });
      if (response.ok) {
        window.alert(
          action === "approve" ? "Document approved." : "Document rejected.",
        );
        await fetchPendingVerifications();
        setSelectedTrade(null);
        setRejectionReason("");
      } else {
        const err = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        window.alert(err.error ?? "Review failed.");
      }
    } catch {
      window.alert("Review action failed.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-8 text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/analytics"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Admin analytics
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Verification reviews
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pending uploads:{" "}
            <span className="font-semibold text-foreground">{pendingCount}</span>
          </p>
        </div>
      </div>

      {pendingTrades.length === 0 ? (
        <p className="text-muted-foreground">No pending verifications.</p>
      ) : (
        <div className="grid gap-6">
          {pendingTrades.map((trade) => (
            <Card key={trade.id}>
              <CardHeader>
                <CardTitle>
                  {trade.business_name ?? "—"} ({trade.id ?? "—"})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {trade.contact_email ?? ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {trade.id_proof_status === "pending" ? (
                  <div className="border-l-4 border-amber-500 pl-4">
                    <h3 className="mb-2 font-semibold">ID — pending review</h3>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        disabled={!fileBasename(trade.id_proof_file)}
                        onClick={() => {
                          const b = fileBasename(trade.id_proof_file);
                          if (!b) return;
                          window.open(
                            `/api/admin/verification/download/${encodeURIComponent(b)}`,
                            "_blank",
                          );
                        }}
                      >
                        View document
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        type="button"
                        onClick={() =>
                          trade.id && handleReview(trade.id, "id_proof", "approve")
                        }
                      >
                        <CheckCircle className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setSelectedTrade({ ...trade, docType: "id_proof" })
                        }
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ) : null}

                {trade.insurance_status === "pending" ? (
                  <div className="border-l-4 border-amber-500 pl-4">
                    <h3 className="mb-2 font-semibold">
                      Insurance — pending review
                    </h3>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        disabled={!fileBasename(trade.insurance_file)}
                        onClick={() => {
                          const b = fileBasename(trade.insurance_file);
                          if (!b) return;
                          window.open(
                            `/api/admin/verification/download/${encodeURIComponent(b)}`,
                            "_blank",
                          );
                        }}
                      >
                        View document
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        type="button"
                        onClick={() =>
                          trade.id &&
                          handleReview(trade.id, "insurance", "approve")
                        }
                      >
                        <CheckCircle className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setSelectedTrade({ ...trade, docType: "insurance" })
                        }
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTrade?.docType && selectedTrade.id ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject document</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Reason for rejection (shown to tradesperson)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  type="button"
                  disabled={!rejectionReason.trim()}
                  onClick={() =>
                    handleReview(
                      selectedTrade.id!,
                      selectedTrade.docType!,
                      "reject",
                    )
                  }
                >
                  Confirm rejection
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setSelectedTrade(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
