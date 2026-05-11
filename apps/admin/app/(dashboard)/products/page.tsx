import type { Metadata } from 'next';
import type { PagedResult, ProductListItem } from '@saas/api-client';
import Link from 'next/link';
import { getServerApi } from '@/lib/server-api';
import { formatPrice } from '@/lib/utils';
import { Plus } from 'lucide-react';
import DeleteProductButton from '@/components/DeleteProductButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ürünler' };

interface Props {
  searchParams: Promise<{ search?: string; page?: string; category?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const api = await getServerApi();
  let result: PagedResult<ProductListItem> = { items: [], totalCount: 0, totalPages: 0, page: 1, pageSize: 20, hasNext: false, hasPrev: false };
  let categories: { id: string; name: string }[] = [];

  try {
    [result, categories] = await Promise.all([
      api.catalog.getProducts({ search: params.search, categoryId: params.category, page, pageSize: 20 }),
      api.catalog.getCategories(),
    ]);
  } catch { /* ignore */ }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold lg:text-3xl">Ürünler</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 lg:gap-2 lg:px-4"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Yeni Ürün</span>
          <span className="sm:hidden">Ekle</span>
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-col gap-2 sm:flex-row">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Ürün ara..."
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-2">
          <select
            name="category"
            defaultValue={params.category ?? ''}
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary sm:flex-none"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-muted px-4 py-2 text-sm hover:bg-muted/80">
            Filtrele
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-3 text-left font-medium lg:px-4">Ürün</th>
              <th className="hidden px-3 py-3 text-left font-medium md:table-cell lg:px-4">Kategori</th>
              <th className="px-3 py-3 text-right font-medium lg:px-4">Fiyat</th>
              <th className="hidden px-3 py-3 text-center font-medium sm:table-cell lg:px-4">Stok</th>
              <th className="hidden px-3 py-3 text-center font-medium sm:table-cell lg:px-4">Durum</th>
              <th className="px-3 py-3 text-right font-medium lg:px-4">İşlem</th>
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
                  <td className="px-3 py-3 lg:px-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                      {/* Mobile-only inline badges */}
                      <div className="mt-1 flex gap-1.5 sm:hidden">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.availableQuantity} adet
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                          {product.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-muted-foreground md:table-cell lg:px-4">
                    {product.categoryName ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-medium lg:px-4">{formatPrice(product.price)}</td>
                  <td className="hidden px-3 py-3 text-center sm:table-cell lg:px-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${product.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.availableQuantity}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-center sm:table-cell lg:px-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                      {product.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right lg:px-4">
                    <div className="flex justify-end gap-1 lg:gap-2">
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
