import type { MetadataRoute } from "next";
import {
  BRAND_COOKIE_URL,
  BRAND_DATA_REQUEST_URL,
  BRAND_DPA_URL,
  BRAND_HELP_URL,
  BRAND_IMPRINT_URL,
  BRAND_PRIVACY_URL,
  BRAND_REFUNDS_URL,
  BRAND_SUBPROCESSORS_URL,
  BRAND_TERMS_URL,
  BRAND_URL,
} from "@/lib/brand";
import { HELP_ARTICLES } from "@/lib/help/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const yearly = { lastModified, changeFrequency: "yearly" as const, priority: 0.5 };
  return [
    {
      url: BRAND_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    { url: BRAND_PRIVACY_URL, ...yearly },
    { url: BRAND_TERMS_URL, ...yearly },
    { url: BRAND_COOKIE_URL, ...yearly },
    { url: BRAND_IMPRINT_URL, ...yearly },
    { url: BRAND_REFUNDS_URL, ...yearly },
    { url: BRAND_SUBPROCESSORS_URL, ...yearly },
    { url: BRAND_DPA_URL, ...yearly },
    {
      url: BRAND_DATA_REQUEST_URL,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: BRAND_HELP_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...HELP_ARTICLES.map((article) => ({
      url: `${BRAND_HELP_URL}/${article.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
