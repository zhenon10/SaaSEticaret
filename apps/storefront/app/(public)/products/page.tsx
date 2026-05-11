import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { Category, ProductListItem, PagedResult } from '@saas/api-client';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kumandacibaba.com';

interface Props {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
    inStock?: string;
    featured?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;

  let title = 'Ürünler';
  let description = 'Tüm ürünleri incele, en uygun fiyatlarla alışveriş yap.';

  if (params.search) {
    title       = `"${params.search}" için sonuçlar`;
    description = `${params.search} araması için ürün sonuçları.`;
  } else if (params.category) {
    try {
      const cats = await api.catalog.getCategoryTree();
      function findCat(list: Category[], id: string): Category | undefined {
        for (const c of list) {
          if (c.id === id) return c;
          const found = findCat(c.children ?? [], id);
          if (found) return found;
        }
      }
      const cat = findCat(cats, params.category);
      if (cat) {
        title       = cat.name;
        description = `${cat.name} kategorisindeki tüm ürünleri incele.`;
      }
    } catch { /* keep defaults */ }
  }

  const canonical = params.category
    ? `${SITE_URL}/products?category=${params.category}`
    : `${SITE_URL}/products`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph:  { title, description, url: canonical, type: 'website' },
  };
}

function isOrHasActive(cat: Category, activeId?: string): boolean {
  if (!activeId) return false;
  if (cat.id === activeId) return true;
  return (cat.children ?? []).some((c) => isOrHasActive(c, activeId));
}

function CategorySidebarItem({
  cat,
  activeId,
  level = 0,
}: {
  cat: Category;
  activeId?: string;
  level?: number;
}) {
  const isActive = cat.id === activeId;
  const expanded = isOrHasActive(cat, activeId);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  const pl = 16 + level * 14;

  return (
    <>
      <li>
        <Link
          href={`/products?category=${cat.id}`}
          style={{ paddingLeft: pl }}
          className={`flex items-center justify-between pr-4 py-2 text-sm transition-colors hover:bg-orange-50 hover:text-primary ${
            isActive
              ? 'font-semibold text-primary border-l-2 border-primary bg-orange-50'
              : 'text-gray-700'
          }`}
        >
          <span className="flex items-center gap-1">
            {level > 0 && <span className="text-gray-300 text-xs">└</span>}
            {cat.name}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {cat.productCount != null && (
              <span className="text-xs text-gray-400">({cat.productCount})</span>
            )}
            {hasChildren && (
              <ChevronDown
                className={`h-3 w-3 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            )}
          </span>
        </Link>
      </li>
      {hasChildren && expanded &&
        cat.children!.map((child) => (
          <CategorySidebarItem key={child.id} cat={child} activeId={activeId} level={level + 1} />
        ))}
    </>
  );
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  let result: PagedResult<ProductListItem> = { items: [], totalCount: 0, totalPages: 0, page: 1, hasNext: false, hasPrev: false, pageSize: 20 };
  let categoryTree: Category[] = [];

  try {
    [result, categoryTree] = await Promise.all([
      api.catalog.getProducts({
        search: params.search,
        categoryId: params.category,
        inStockOnly: params.inStock === '1',
        isFeatured: params.featured === '1' ? true : undefined,
        isActive: true,
        page,
        pageSize: 16,
      }),
      api.catalog.getCategoryTree(),
    ]);
  } catch {
    // graceful degradation
  }

  function findCategory(cats: Category[], id?: string): Category | undefined {
    if (!id) return undefined;
    for (const c of cats) {
      if (c.id === id) return c;
      const found = findCategory(c.children ?? [], id);
      if (found) return found;
    }
  }

  const activeCategory = findCategory(categoryTree, params.category);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-5">

          {/* ── Sidebar ─────────────────────────────────── */}
          <aside className="hidden w-52 shrink-0 lg:block">
            <div className="rounded-sm border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold text-gray-800">Kategori</h3>
              </div>
              <ul className="py-2">
                <li>
                  <Link
                    href="/products"
                    className={`flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-orange-50 hover:text-primary ${
                      !params.category ? 'font-semibold text-primary' : 'text-gray-700'
                    }`}
                  >
                    Tüm kategoriler
                    <span className="text-xs text-gray-400">({result.totalCount})</span>
                  </Link>
                </li>
                {categoryTree.map((cat) => (
                  <CategorySidebarItem key={cat.id} cat={cat} activeId={params.category} />
                ))}
              </ul>
            </div>

            {/* Stock filter */}
            <div className="mt-4 rounded-sm border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold text-gray-800">Stok Durumu</h3>
              </div>
              <ul className="py-2">
                <li>
                  <Link
                    href={params.category ? `/products?category=${params.category}` : '/products'}
                    className={`flex items-center px-4 py-2 text-sm transition-colors hover:text-primary ${
                      params.inStock !== '1' ? 'font-semibold text-primary' : 'text-gray-700'
                    }`}
                  >
                    Tüm Ürünler
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/products?${params.category ? `category=${params.category}&` : ''}inStock=1`}
                    className={`flex items-center px-4 py-2 text-sm transition-colors hover:text-primary ${
                      params.inStock === '1' ? 'font-semibold text-primary' : 'text-gray-700'
                    }`}
                  >
                    Stokta Olanlar
                  </Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* ── Main content ────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Search bar + filter row */}
            <div className="mb-4 flex items-center gap-3">
              <form className="flex flex-1 items-center gap-2 rounded-sm border border-gray-200 bg-white px-3 py-2">
                <input
                  name="search"
                  defaultValue={params.search}
                  placeholder="Bu kategoride ara..."
                  className="flex-1 text-sm outline-none placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90"
                >
                  Ara
                </button>
              </form>
              <div className="flex items-center gap-1 rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrele</span>
              </div>
            </div>

            {/* Breadcrumb + count */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/products" className="hover:text-primary">Tüm Ürünler</Link>
                {activeCategory && (
                  <>
                    <span>/</span>
                    <span className="font-medium text-gray-800">{activeCategory.name}</span>
                  </>
                )}
                {params.search && (
                  <>
                    <span>/</span>
                    <span className="font-medium text-gray-800">"{params.search}"</span>
                  </>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {result.totalCount} ürün bulundu
              </span>
            </div>

            {/* Product grid */}
            {result.items.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-sm border border-gray-200 bg-white text-gray-400">
                <span className="text-4xl">🔍</span>
                <p className="text-sm">Ürün bulunamadı.</p>
                <Link href="/products" className="text-sm text-primary hover:underline">
                  Tüm ürünleri gör
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
                {result.hasPrev && (
                  <a
                    href={`/products?page=${page - 1}${params.category ? `&category=${params.category}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                    className="flex h-9 items-center rounded border border-gray-200 bg-white px-4 text-sm hover:border-primary hover:text-primary"
                  >
                    ← Önceki
                  </a>
                )}
                {Array.from({ length: Math.min(result.totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <a
                      key={p}
                      href={`/products?page=${p}${params.category ? `&category=${params.category}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                      className={`flex h-9 w-9 items-center justify-center rounded border text-sm transition-colors ${
                        p === page
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 bg-white hover:border-primary hover:text-primary'
                      }`}
                    >
                      {p}
                    </a>
                  );
                })}
                {result.hasNext && (
                  <a
                    href={`/products?page=${page + 1}${params.category ? `&category=${params.category}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                    className="flex h-9 items-center rounded border border-gray-200 bg-white px-4 text-sm hover:border-primary hover:text-primary"
                  >
                    Sonraki →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
