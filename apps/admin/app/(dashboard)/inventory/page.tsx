import type { Metadata } from 'next';
import type { PagedResult, ProductListItem } from '@saas/api-client';
import { getServerApi } from '@/lib/server-api';
import InventoryUpdateForm from '@/components/InventoryUpdateForm';

export const metadata: Metadata = { title: 'Stok Yönetimi' };

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const api = await getServerApi();
  let result: PagedResult<ProductListItem> = { items: [], totalCount: 0, totalPages: 0, page: 1, pageSize: 20, hasNext: false, hasPrev: false };
  try {
    result = await api.catalog.getProducts({ search: params.search, page, pageSize: 20 });
  } catch { /* ignore */ }

  return (
    <div className="space-y-4 lg:space-y-6">
      <h1 className="text-2xl font-bold lg:text-3xl">Stok Yönetimi</h1>

      <form className="flex gap-2">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Ürün ara..."
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-xs"
        />
        <button type="submit" className="rounded-md bg-muted px-4 py-2 text-sm hover:bg-muted/80">Ara</button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-3 text-left font-medium lg:px-4">Ürün</th>
              <th className="hidden px-3 py-3 text-center font-medium md:table-cell lg:px-4">Toplam</th>
              <th className="hidden px-3 py-3 text-center font-medium md:table-cell lg:px-4">Rezerve</th>
              <th className="px-3 py-3 text-center font-medium lg:px-4">Mevcut</th>
              <th className="hidden px-3 py-3 text-center font-medium sm:table-cell lg:px-4">Durum</th>
              <th className="px-3 py-3 text-right font-medium lg:px-4">Güncelle</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Ürün bulunamadı.</td>
              </tr>
            ) : (
              result.items.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3 lg:px-4">
                    <p className="font-medium">{product.name}</p>
                    {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                  </td>
                  <td className="hidden px-3 py-3 text-center md:table-cell lg:px-4">—</td>
                  <td className="hidden px-3 py-3 text-center md:table-cell lg:px-4">—</td>
                  <td className="px-3 py-3 text-center lg:px-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${product.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.availableQuantity}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-center text-xs text-muted-foreground sm:table-cell lg:px-4">
                    {!product.isInStock ? 'Stok Yok' : product.availableQuantity <= 5 ? '⚠ Düşük' : '✓ Normal'}
                  </td>
                  <td className="px-3 py-3 text-right lg:px-4">
                    <InventoryUpdateForm productId={product.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
