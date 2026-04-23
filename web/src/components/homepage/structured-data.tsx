/** JSON-LD for homepage SEO (Organization + WebSite). */
export function HomeStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "TradeScore",
        url: "https://tradescore.uk",
        description:
          "AI-powered lead matching for homeowners and verified tradesmen in Glasgow.",
        areaServed: {
          "@type": "City",
          name: "Glasgow",
          addressCountry: "GB",
        },
      },
      {
        "@type": "WebSite",
        name: "TradeScore",
        url: "https://tradescore.uk",
        description:
          "Stop competing with ten other trades. Quality leads, transparent pricing, secure payments.",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
