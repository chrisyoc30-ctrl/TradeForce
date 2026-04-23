import { homeownerFaqs, tradesmanFaqs } from "@/lib/faq-content";

export function FaqJsonLd() {
  const mainEntity = [...homeownerFaqs, ...tradesmanFaqs].map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  }));

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
