import type { MetadataRoute } from "next";
import {
  BRAND_COOKIE_URL,
  BRAND_DATA_REQUEST_URL,
  BRAND_DPA_URL,
  BRAND_IMPRINT_URL,
  BRAND_PRIVACY_URL,
  BRAND_REFUNDS_URL,
  BRAND_SUBPROCESSORS_URL,
  BRAND_TERMS_URL,
  BRAND_URL,
} from "@/lib/brand";

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
  ];
}
