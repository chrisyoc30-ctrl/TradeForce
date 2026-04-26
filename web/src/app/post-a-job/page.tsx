import { redirect } from "next/navigation";

/** Route kept for old links; job posting is at /lead-capture */
export default function PostAJob() {
  redirect("/lead-capture");
}
