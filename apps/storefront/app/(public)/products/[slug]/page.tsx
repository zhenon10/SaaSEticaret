import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import ProductDetailClient from '@/components/ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.catalog.getProductBySlug(slug);
    return { title: product.name, description: product.description };
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

  return <ProductDetailClient product={product} />;
}
