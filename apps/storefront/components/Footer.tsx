import Link from 'next/link';
import { api } from '@/lib/api';

type FooterLink   = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

function parseJson<T>(raw: string | undefined, fallback: T): T {
  try { if (raw) return JSON.parse(raw) as T; } catch { /* ignore */ }
  return fallback;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: 'Alışveriş',
    links: [
      { label: 'Tüm Ürünler',      href: '/products' },
      { label: 'Öne Çıkanlar',     href: '/products?featured=1' },
      { label: 'Yeni Gelenler',    href: '/products' },
      { label: 'İndirimli Ürünler', href: '/products' },
    ],
  },
  {
    title: 'Hesabım',
    links: [
      { label: 'Giriş Yap',    href: '/login' },
      { label: 'Siparişlerim', href: '/account/orders' },
      { label: 'Sepetim',      href: '/cart' },
    ],
  },
];

const DEFAULT_LEGAL: FooterLink[] = [
  { label: 'Gizlilik Politikası', href: '/privacy' },
  { label: 'Kullanım Koşulları',  href: '/terms' },
  { label: 'KVKK',                href: '/kvkk' },
];

export default async function Footer() {
  let s: Record<string, string> = {};
  try { s = await api.settings.getAll(); } catch { /* use defaults */ }

  const storeName   = s['store.name']          || 'mağaza';
  const description = s['footer.description']  || "Türkiye'nin güvenilir online alışveriş platformu.";
  const email       = s['footer.contact.email'] || '';
  const phone       = s['footer.contact.phone'] || '';
  const hours       = s['footer.contact.hours'] || '';
  const copyright   = s['footer.copyright']    || 'Tüm hakları saklıdır.';
  const columns     = parseJson<FooterColumn[]>(s['footer.columns'], DEFAULT_COLUMNS);
  const legal       = parseJson<FooterLink[]>(s['footer.legal'],   DEFAULT_LEGAL);

  const hasContact = email || phone || hours;
  const totalCols  = columns.length + (hasContact ? 1 : 0) + 1; // +1 brand
  const gridClass  = totalCols >= 4
    ? 'sm:grid-cols-2 lg:grid-cols-4'
    : totalCols === 3
    ? 'sm:grid-cols-3'
    : 'sm:grid-cols-2';

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className={`container mx-auto grid gap-8 px-4 py-12 ${gridClass}`}>

        {/* Brand */}
        <div>
          <span className="text-xl font-extrabold text-primary">{storeName}</span>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">{description}</p>
        </div>

        {/* Dynamic link columns */}
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-primary">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        {hasContact && (
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">İletişim</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {email && <li>📧 {email}</li>}
              {phone && <li>📞 {phone}</li>}
              {hours && <li>🕐 {hours}</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {storeName}. {copyright}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {legal.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
