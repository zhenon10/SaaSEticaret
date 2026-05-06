import type { Metadata } from 'next';
import { api } from '@/lib/api';
import ProductForm from '@/components/ProductForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Yeni Ürün' };

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  try {
    categories = await api.catalog.getCategories();
  } catch { /* ignore */ }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Yeni Ürün</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
