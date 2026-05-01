import type { Metadata } from 'next';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = { title: 'Ürünler' };
export const revalidate = 60;

interface Props {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
    inStock?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  let result = { items: [], totalCount: 0, totalPages: 0, page: 1, hasNext: false, hasPrev: false };
  let categories: { id: string; name: string; slug: string }[] = [];

  try {
    [result, categories] = await Promise.all([
      api.catalog.getProducts({
        search: params.search,
        categoryId: params.category,
        inStockOnly: params.inStock === '1',
        isActive: true,
        page,
        pageSize: 12,
      }),
      api.catalog.getCategories(),
    ]);
  } catch {
    // graceful degradation
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Ürünler</h1>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Kategoriler</h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="/products"
                  className="block rounded px-2 py-1 text-sm hover:bg-muted"
                >
                  Tümü
                </a>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/products?category=${cat.id}`}
                    className="block rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Search */}
          <form className="mb-6 flex gap-2">
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Ürün ara..."
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Ara
            </button>
          </form>

          {result.items.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Ürün bulunamadı.
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {result.totalCount} ürün bulundu
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {result.hasPrev && (
                    <a
                      href={`/products?page=${page - 1}`}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      ← Önceki
                    </a>
                  )}
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    {page} / {result.totalPages}
                  </span>
                  {result.hasNext && (
                    <a
                      href={`/products?page=${page + 1}`}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      Sonraki →
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
