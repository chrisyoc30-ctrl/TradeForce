import Link from "next/link";

export const metadata = {
  title: "Payment received | TradeScore",
  description: "Your lead acceptance payment was successful",
};

export default function AcceptSuccessPage() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <h1>Payment received — lead unlocked!</h1>
      <p>
        Thanks for accepting this lead via TradeScore. The homeowner&apos;s
        contact details are now in your dashboard. Reach out to them within 24
        hours to maximize your chance of winning the job.
      </p>
      <Link
        href="/lead-scoring"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          background: "#f97316",
          color: "white",
          borderRadius: 8,
          textDecoration: "none",
          marginTop: 16,
        }}
      >
        Back to Available Leads
      </Link>
    </div>
  );
}
