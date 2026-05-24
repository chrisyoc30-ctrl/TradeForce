import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

/** Legacy route — canonical verification form is at /verify */
export default async function VerificationRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const id = (params.id ?? "").trim();
  if (id) {
    redirect(`/verify?id=${encodeURIComponent(id)}`);
  }
  redirect("/verify");
}
