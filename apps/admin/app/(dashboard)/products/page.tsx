import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Plus } from 'lucide-react';
import DeleteProductButton from '@/components/DeleteProductButton';

export const metadata: Metadata = { title: 'Ürünler' };

interface Props {
  searchParams: Promise<{ search?: string; page?: string; category?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  let result = { items: [], totalCount: 0, totalPages: 0, page: 1, hasNext: false, hasPrev: false };
  let categories: { id: string; name: string }[] = [];

  try {
    [result, categories] = await Promise.all([
      api.catalog.getProducts({ search: params.search, categoryId: params.category, page, pageSize: 20 }),
      api.catalog.getCategories(),
    ]);
  } catch { /* ignore */ }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ürünler</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Yeni Ürün
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Ürün ara..."
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          name="category"
          defaultValue={params.category ?? ''}
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-muted px-4 py-2 text-sm hover:bg-muted/80">
          Filtrele
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Ürün</th>
              <th className="px-4 py-3 text-left font-medium">Kategori</th>
              <th className="px-4 py-3 text-right font-medium">Fiyat</th>
              <th className="px-4 py-3 text-center font-medium">Stok</th>
              <th className="px-4 py-3 text-center font-medium">Durum</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Ürün bulunamadı.
                </td>
              </tr>
            ) : (
              result.items.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.categoryName ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${product.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.availableQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                      {product.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/products/${product.id}/edit`} className="rounded px-2 py-1 text-xs hover:bg-muted">
                        Düzenle
                      </Link>
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {result.hasPrev && (
            <a href={`/products?page=${page - 1}`} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">← Önceki</a>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">{page} / {result.totalPages}</span>
          {result.hasNext && (
            <a href={`/products?page=${page + 1}`} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Sonraki →</a>
          )}
        </div>
      )}
    </div>
  );
}
