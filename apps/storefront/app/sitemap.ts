import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kumandacibaba.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,              lastModified: now, changeFrequency: 'daily',  priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily',  priority: 0.9 },
  ];

  let productRoutes:  MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const [productsResult, categories] = await Promise.all([
      api.catalog.getProducts({ isActive: true, pageSize: 1000 }),
      api.catalog.getCategories(),
    ]);

    productRoutes = productsResult.items.map((p) => ({
      url:             `${SITE_URL}/products/${p.slug}`,
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }));

    categoryRoutes = categories
      .filter((c) => c.isActive !== false)
      .map((c) => ({
        url:             `${SITE_URL}/products?category=${c.id}`,
        lastModified:    now,
        changeFrequency: 'weekly' as const,
        priority:        0.7,
      }));
  } catch {
    // API unavailable — return static routes only
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
