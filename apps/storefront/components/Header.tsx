import Link from 'next/link';
import { cookies } from 'next/headers';
import { Heart, User, Menu } from 'lucide-react';
import SearchBar from './SearchBar';
import AccountDropdown from './AccountDropdown';
import CartBadge from './CartBadge';
import { api } from '@/lib/api';

const DEFAULT_NAV_LINKS = [
  { label: 'Yeni Gelenler', href: '/products' },
  { label: 'Öne Çıkanlar', href: '/products?featured=1' },
  { label: 'İndirimli Ürünler', href: '/products' },
];

export default async function Header() {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('st_at')?.value;

  let navLinks = DEFAULT_NAV_LINKS;
  let storeName = 'mağaza';
  let userName = '';
  let userPhone: string | undefined;

  try {
    const settings = await api.settings.getAll();
    if (settings['store.name']) storeName = settings['store.name'];
    const raw = settings['nav.links'];
    if (raw) {
      const parsed = JSON.parse(raw) as { label: string; href: string }[];
      if (Array.isArray(parsed) && parsed.length > 0) navLinks = parsed;
    }
  } catch {
    // fall back to defaults
  }

  if (isLoggedIn) {
    try {
      const user = await api.auth.me();
      userName  = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
      userPhone = user.phone ?? undefined;
    } catch { /* ignore */ }
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* ── Top row ──────────────────────────────────────── */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto flex h-16 items-center gap-6 px-4">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-2xl font-extrabold tracking-tight text-primary"
          >
            {storeName}
          </Link>

          {/* Search */}
          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>

          {/* Actions */}
          <nav className="flex shrink-0 items-center gap-5">
            {isLoggedIn ? (
              <AccountDropdown name={userName} phone={userPhone} />
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-0.5 text-gray-600 transition-colors hover:text-primary"
              >
                <User className="h-5 w-5" />
                <span className="text-[11px]">Giriş Yap</span>
              </Link>
            )}
            <Link
              href="/products"
              className="flex flex-col items-center gap-0.5 text-gray-600 transition-colors hover:text-primary"
            >
              <Heart className="h-5 w-5" />
              <span className="text-[11px]">Favorilerim</span>
            </Link>
            <CartBadge />
          </nav>
        </div>
      </div>

      {/* ── Category nav row ─────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto flex h-11 items-stretch px-4">
          {/* All categories button */}
          <button className="flex shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white">
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">TÜM KATEGORİLER</span>
          </button>

          {/* Nav links */}
          <nav className="flex items-stretch overflow-x-auto scrollbar-hide">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center whitespace-nowrap border-b-2 border-transparent px-4 text-sm text-gray-700 transition-colors hover:border-primary hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
