import { redirect } from "next/navigation";

/** Legacy success URL; submission now shows inline on /lead-capture. */
export default function LeadCaptureLegacySuccessPage() {
  redirect("/lead-capture");
}
