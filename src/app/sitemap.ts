import type { MetadataRoute } from "next";
import { BRAND_COOKIE_URL, BRAND_DATA_REQUEST_URL, BRAND_PRIVACY_URL, BRAND_TERMS_URL, BRAND_URL } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: BRAND_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: BRAND_PRIVACY_URL,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: BRAND_TERMS_URL,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: BRAND_COOKIE_URL,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: BRAND_DATA_REQUEST_URL,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
