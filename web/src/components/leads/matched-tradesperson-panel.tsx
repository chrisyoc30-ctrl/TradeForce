"use client";

import { trpc } from "@/trpc/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VerificationBadges } from "@/components/trades/verification-badges";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  leadId: string;
  matchedTradespersonId: string;
};

export function MatchedTradespersonPanel({
  leadId,
  matchedTradespersonId,
}: Props) {
  const q = trpc.leads.getMatched.useQuery(
    { leadId },
    { enabled: Boolean(leadId && matchedTradespersonId.trim()) },
  );

  const trade = q.data?.[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-medium">Matched tradesperson</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {q.isLoading ? (
          <Skeleton className="h-16 w-full rounded-md" />
        ) : trade ? (
          <>
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium text-foreground">{trade.name}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Trade:</span>{" "}
              {trade.trade || "—"}
            </p>
            <div className="pt-1">
              <p className="mb-1 text-xs text-muted-foreground">
                Verification ({trade.verificationStatus?.replace(/_/g, " ") ?? "—"})
              </p>
              <VerificationBadges badges={trade.verificationBadges} />
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            We couldn&apos;t load verification details for this match.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
