import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

export default async function HomePage() {
  let featuredProducts = [];
  try {
    const result = await api.catalog.getProducts({ isFeatured: true, isActive: true, pageSize: 8 });
    featuredProducts = result.items;
  } catch {
    // API unavailable during build — graceful degradation
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-12 rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
        <h1 className="mb-4 text-4xl font-bold">Hoş Geldiniz</h1>
        <p className="mb-8 text-lg opacity-90">En yeni ürünleri keşfedin</p>
        <Link
          href="/products"
          className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90 transition-colors"
        >
          Alışverişe Başla
        </Link>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Öne Çıkan Ürünler</h2>
            <Link href="/products" className="text-sm text-primary hover:underline">
              Tümünü Gör →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
