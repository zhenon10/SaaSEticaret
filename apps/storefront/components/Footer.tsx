import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="container mx-auto grid gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <span className="text-xl font-extrabold text-primary">mağaza</span>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            Türkiye'nin güvenilir online alışveriş platformu. Binlerce ürün, uygun fiyat.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Alışveriş</h4>
          <ul className="space-y-2 text-sm">
            {[
              { label: 'Tüm Ürünler', href: '/products' },
              { label: 'Öne Çıkanlar', href: '/products?featured=1' },
              { label: 'Yeni Gelenler', href: '/products' },
              { label: 'İndirimli Ürünler', href: '/products' },
            ].map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Hesabım</h4>
          <ul className="space-y-2 text-sm">
            {[
              { label: 'Giriş Yap', href: '/login' },
              { label: 'Siparişlerim', href: '/account/orders' },
              { label: 'Sepetim', href: '/cart' },
            ].map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">İletişim</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📧 destek@magaza.com</li>
            <li>📞 0850 000 00 00</li>
            <li>🕐 Hafta içi 09:00 – 18:00</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Mağaza. Tüm hakları saklıdır.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-primary">Gizlilik Politikası</span>
            <span className="cursor-pointer hover:text-primary">Kullanım Koşulları</span>
            <span className="cursor-pointer hover:text-primary">KVKK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
