import type { MetadataRoute } from "next";

const base = "https://tradescore.uk";

const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] =
  [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.85 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.6 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.6 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.85 },
    { path: "/lead-capture", changeFrequency: "weekly", priority: 0.9 },
    { path: "/lead-scoring", changeFrequency: "weekly", priority: 0.9 },
    { path: "/homeowner-dashboard", changeFrequency: "monthly", priority: 0.7 },
    { path: "/available-jobs", changeFrequency: "weekly", priority: 0.85 },
    { path: "/tradesman-signup", changeFrequency: "monthly", priority: 0.8 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
