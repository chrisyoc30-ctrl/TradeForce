"use client";

import { useRouter } from "next/navigation";

export default function PostAJob() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm"
          >
            ← Back
          </button>
        </div>
      </div>
      <div className="container max-w-2xl py-12">
        <h1 className="mb-4 text-4xl font-bold">Post a Job</h1>
        <div className="rounded-lg border bg-card p-8">
          <p>Coming soon</p>
        </div>
      </div>
    </div>
  );
}
