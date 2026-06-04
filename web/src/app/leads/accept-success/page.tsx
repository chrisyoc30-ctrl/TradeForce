import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import AcceptSuccessView from "./accept-success-view";

export default function AcceptSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      }
    >
      <AcceptSuccessView />
    </Suspense>
  );
}
