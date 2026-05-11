import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import ProductDetailClient from '@/components/ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kumandacibaba.com';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.catalog.getProductBySlug(slug);
    const url         = `${SITE_URL}/products/${slug}`;
    const description = product.description
      ? product.description.slice(0, 160)
      : `${product.name} — en uygun fiyatla satın al`;
    const image = product.images?.[0]?.url ?? '';

    return {
      title:      product.name,
      description,
      alternates: { canonical: url },
      openGraph: {
        title:       product.name,
        description,
        url,
        type:        'website',
        images:      image ? [{ url: image, alt: product.name }] : [],
      },
      twitter: {
        card:        'summary_large_image',
        title:       product.name,
        description,
        images:      image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Ürün Bulunamadı' };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  let product;
  try {
    product = await api.catalog.getProductBySlug(slug);
  } catch {
    notFound();
  }

  if (!product) notFound();

  const url         = `${SITE_URL}/products/${slug}`;
  const description = product.description ?? `${product.name} — en uygun fiyatla satın al`;
  const images      = product.images?.map((i) => i.url) ?? [];
  const inStock     = (product.inventory?.availableQuantity ?? 0) > 0;

  const jsonLd = {
    '@context':  'https://schema.org',
    '@type':     'Product',
    name:        product.name,
    description,
    image:       images,
    sku:         product.sku,
    url,
    offers: {
      '@type':       'Offer',
      price:         product.price,
      priceCurrency: 'TRY',
      availability:  inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url,
      ...(product.compareAtPrice ? { priceValidUntil: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10) } : {}),
    },
    ...(product.category ? {
      category: product.category.name,
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
