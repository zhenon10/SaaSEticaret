import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import {
  ShirtIcon,
  Footprints,
  Watch,
  Baby,
  Sparkles,
  Home,
  Dumbbell,
  Laptop,
} from 'lucide-react';

export const revalidate = 60;

const CATEGORY_ICONS = [
  { label: 'Kadın', icon: ShirtIcon, href: '/products' },
  { label: 'Erkek', icon: ShirtIcon, href: '/products' },
  { label: 'Ayakkabı', icon: Footprints, href: '/products' },
  { label: 'Aksesuar', icon: Watch, href: '/products' },
  { label: 'Çocuk', icon: Baby, href: '/products' },
  { label: 'Kozmetik', icon: Sparkles, href: '/products' },
  { label: 'Ev & Yaşam', icon: Home, href: '/products' },
  { label: 'Spor', icon: Dumbbell, href: '/products' },
];

export default async function HomePage() {
  let featuredProducts: any[] = [];
  let newProducts: any[] = [];

  try {
    const [featured, newest] = await Promise.all([
      api.catalog.getProducts({ isFeatured: true, isActive: true, pageSize: 8 }),
      api.catalog.getProducts({ isActive: true, pageSize: 8 }),
    ]);
    featuredProducts = featured.items;
    newProducts = newest.items;
  } catch {
    // API unavailable during build — graceful degradation
  }

  const displayProducts = featuredProducts.length > 0 ? featuredProducts : newProducts;

  return (
    <div className="bg-gray-50">
      {/* ── Hero Banner ────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-orange-400">
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-100">
            Yeni Sezon Koleksiyonu
          </p>
          <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">
            Trendleri Yakalay
          </h1>
          <p className="mb-8 text-lg text-orange-100 opacity-90">
            Binlerce ürün, uygun fiyatlarla kapınıza kadar
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-primary shadow transition-transform hover:scale-105"
            >
              Alışverişe Başla
            </Link>
            <Link
              href="/products?featured=1"
              className="rounded-full border-2 border-white px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Öne Çıkanlar
            </Link>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5" />
      </section>

      {/* ── Category Quick Links ────────────────────────── */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {CATEGORY_ICONS.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-2 rounded-lg bg-white p-3 text-center shadow-sm border border-gray-100 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-primary">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Campaign Banner ─────────────────────────────── */}
      <section className="container mx-auto px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Ücretsiz Kargo', sub: '150 TL ve üzeri siparişlerde', bg: 'bg-blue-50', text: 'text-blue-700', icon: '🚚' },
            { title: 'Kolay İade', sub: '30 gün içinde ücretsiz iade', bg: 'bg-green-50', text: 'text-green-700', icon: '↩️' },
            { title: 'Güvenli Ödeme', sub: 'SSL ile şifrelenmiş ödeme', bg: 'bg-purple-50', text: 'text-purple-700', icon: '🔒' },
          ].map(({ title, sub, bg, text, icon }) => (
            <div key={title} className={`flex items-center gap-3 rounded-lg ${bg} px-4 py-3`}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className={`text-sm font-bold ${text}`}>{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured / New Products ─────────────────────── */}
      {displayProducts.length > 0 && (
        <section className="container mx-auto px-4 py-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1 rounded-full bg-primary" />
              <h2 className="text-xl font-bold text-gray-800">
                {featuredProducts.length > 0 ? 'Öne Çıkan Ürünler' : 'Yeni Ürünler'}
              </h2>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-1 rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Tümünü Gör →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTA Strip ──────────────────────────────────── */}
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-10 text-center text-white">
          <h3 className="mb-2 text-2xl font-bold">Kampanyaları Kaçırma!</h3>
          <p className="mb-6 text-gray-300">Tüm ürünlere göz at, en uygun fiyatları yakala.</p>
          <Link
            href="/products"
            className="inline-block rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      </section>
    </div>
  );
}
