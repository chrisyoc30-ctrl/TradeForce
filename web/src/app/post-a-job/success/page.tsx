import { redirect } from "next/navigation";

/** Old marketing links pointed here; keep a real route to avoid 404. */
export default function PostAJobLegacySuccessPage() {
  redirect("/lead-capture");
}
