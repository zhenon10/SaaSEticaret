import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import ProductForm from '@/components/ProductForm';

export const metadata: Metadata = { title: 'Ürün Düzenle' };

interface Props { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  let product, categories: { id: string; name: string }[] = [];
  try {
    [product, categories] = await Promise.all([
      api.catalog.getProductById(id),
      api.catalog.getCategories(),
    ]);
  } catch {
    notFound();
  }

  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Ürün Düzenle</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
