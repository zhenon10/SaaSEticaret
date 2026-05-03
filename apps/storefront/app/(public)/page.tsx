import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { getCategoryVisual } from '@/components/CategoryIcon';
import type { Category } from '@saas/api-client';

export const revalidate = 60;

function s(settings: Record<string, string>, key: string, fallback = '') {
  return settings[key] ?? fallback;
}

export default async function HomePage() {
  let featuredProducts: any[] = [];
  let newProducts: any[] = [];
  let settings: Record<string, string> = {};
  let categories: Category[] = [];

  try {
    const [featured, newest, siteSettings, cats] = await Promise.all([
      api.catalog.getProducts({ isFeatured: true, isActive: true, pageSize: 8 }),
      api.catalog.getProducts({ isActive: true, pageSize: 8 }),
      api.settings.getAll(),
      api.catalog.getCategories(),
    ]);
    featuredProducts = featured.items;
    newProducts = newest.items;
    settings = siteSettings;
    categories = cats.filter((c) => c.isActive);
  } catch {
    // API unavailable during build — graceful degradation
  }

  const displayProducts = featuredProducts.length > 0 ? featuredProducts : newProducts;

  // Hero values
  const heroImage   = s(settings, 'hero.image', '');
  const heroBadge   = s(settings, 'hero.badge',    'Yeni Sezon Koleksiyonu');
  const heroTitle   = s(settings, 'hero.title',    'Trendleri Yakala');
  const heroSub     = s(settings, 'hero.subtitle', 'Binlerce ürün, uygun fiyatlarla kapınıza kadar');

  type HeroButton = { text: string; href: string; variant: 'solid' | 'outline' };
  let heroButtons: HeroButton[] = [
    { text: 'Alışverişe Başla', href: '/products',           variant: 'solid'   },
    { text: 'Öne Çıkanlar',    href: '/products?featured=1', variant: 'outline' },
  ];
  try {
    const raw = settings['hero.buttons'];
    if (raw) {
      const parsed = JSON.parse(raw) as HeroButton[];
      if (Array.isArray(parsed) && parsed.length > 0) heroButtons = parsed;
    }
  } catch { /* keep defaults */ }

  // Campaign cards
  const campaigns = [
    {
      icon: '🚚',
      bg: 'bg-blue-50', text: 'text-blue-700',
      title:    s(settings, 'campaign.shipping.title',   'Ücretsiz Kargo'),
      subtitle: s(settings, 'campaign.shipping.subtitle', '150 TL ve üzeri siparişlerde'),
    },
    {
      icon: '↩️',
      bg: 'bg-green-50', text: 'text-green-700',
      title:    s(settings, 'campaign.return.title',   'Kolay İade'),
      subtitle: s(settings, 'campaign.return.subtitle', '30 gün içinde ücretsiz iade'),
    },
    {
      icon: '🔒',
      bg: 'bg-purple-50', text: 'text-purple-700',
      title:    s(settings, 'campaign.payment.title',   'Güvenli Ödeme'),
      subtitle: s(settings, 'campaign.payment.subtitle', 'SSL ile şifrelenmiş ödeme'),
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* ── Hero Banner ────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={heroImage
          ? { backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary-end, var(--primary))))' }
        }
      >
        {heroImage && (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, hsl(var(--primary) / 0.9), hsl(var(--primary-end, var(--primary)) / 0.75))' }}
          />
        )}
        <div className="relative container mx-auto px-4 py-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-100">
            {heroBadge}
          </p>
          <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">
            {heroTitle}
          </h1>
          <p className="mb-8 text-lg text-orange-100 opacity-90">
            {heroSub}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {heroButtons.map((btn, i) =>
              btn.variant === 'outline' ? (
                <Link
                  key={i}
                  href={btn.href}
                  className="rounded-full border-2 border-white px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  {btn.text}
                </Link>
              ) : (
                <Link
                  key={i}
                  href={btn.href}
                  className="rounded-full bg-white px-8 py-3 text-sm font-bold text-primary shadow transition-transform hover:scale-105"
                >
                  {btn.text}
                </Link>
              )
            )}
          </div>
        </div>
        {!heroImage && <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />}
        {!heroImage && <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5" />}
      </section>

      {/* ── Category Quick Links ────────────────────────── */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {categories.slice(0, 8).map((cat) => {
              const { Icon, bg, fg } = getCategoryVisual(cat.name, cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-white p-3 text-center shadow-sm transition-all hover:border-primary hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bg} ${fg} transition-colors group-hover:bg-primary group-hover:text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-primary">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Campaign Cards ──────────────────────────────── */}
      <section className="container mx-auto px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {campaigns.map(({ icon, bg, text, title, subtitle }) => (
            <div key={title} className={`flex items-center gap-3 rounded-lg ${bg} px-4 py-3`}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className={`text-sm font-bold ${text}`}>{title}</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
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
