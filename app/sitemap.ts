import type { MetadataRoute } from "next";
import { getSitemapProperties, getSitemapServiceProviders } from "@/lib/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, providers] = await Promise.all([getSitemapProperties(), getSitemapServiceProviders()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/dorm`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/houses`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/services`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/support`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const propertyPages: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${SITE_URL}/property/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const providerPages: MetadataRoute.Sitemap = providers.map((p) => ({
    url: `${SITE_URL}/service/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...propertyPages, ...providerPages];
}
