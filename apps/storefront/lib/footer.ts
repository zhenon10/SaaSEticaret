import { categoryProductsHref } from '@/lib/categories';
import type { Category } from '@saas/api-client';
import type { TrustItem } from '@/components/product/ProductTrustStrip';

export type FooterLink = { label: string; href: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type FooterViewModel = {
  storeName: string;
  description: string;
  email: string;
  phone: string;
  phoneDigits: string;
  hours: string;
  address: string;
  copyright: string;
  footerBg: string;
  footerTextColor: string;
  columns: FooterColumn[];
  legal: FooterLink[];
  trustItems: TrustItem[];
  showTrustBar: boolean;
  whatsappEnabled: boolean;
  newsletterEnabled: boolean;
  socialInstagram: string;
  socialFacebook: string;
  etbisUrl: string;
  sitemapLinks: FooterLink[];
};

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Müşteri Hizmetleri',
    links: [
      { label: 'Giriş Yap', href: '/login' },
      { label: 'Siparişlerim', href: '/account/orders' },
      { label: 'Sepetim', href: '/cart' },
      { label: 'Favorilerim', href: '/favorites' },
    ],
  },
];

export const DEFAULT_FOOTER_LEGAL: FooterLink[] = [
  { label: 'Gizlilik Politikası', href: '/privacy' },
  { label: 'Kullanım Koşulları', href: '/terms' },
  { label: 'KVKK', href: '/kvkk' },
];

export const DEFAULT_SITEMAP: FooterLink[] = [
  { label: 'Ana Sayfa', href: '/' },
  { label: 'Tüm Ürünler', href: '/products' },
  { label: 'Öne Çıkanlar', href: '/products?featured=1' },
  { label: 'Giriş', href: '/login' },
  { label: 'Kayıt Ol', href: '/register' },
];

function parseJson<T>(raw: string | undefined, fallback: T): T {
  try {
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? '90' + digits.slice(1) : digits;
}

export function buildCategoryColumn(categories: Category[]): FooterColumn {
  return {
    title: 'Kategoriler',
    links: [
      { label: 'Tüm Ürünler', href: '/products' },
      { label: 'Öne Çıkanlar', href: '/products?featured=1' },
      ...categories
        .filter((c) => c.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((c) => ({ label: c.name, href: categoryProductsHref(c.slug) })),
    ],
  };
}

export function buildFooterViewModel(
  settings: Record<string, string>,
  categories: Category[],
): FooterViewModel {
  const storeName = settings['store.name'] || 'Mağaza';
  const useCategoryLinks = settings['footer.useCategoryLinks'] !== 'false';

  let columns = parseJson<FooterColumn[]>(settings['footer.columns'], DEFAULT_FOOTER_COLUMNS);

  if (useCategoryLinks && categories.length > 0) {
    const catCol = buildCategoryColumn(categories);
    const rest = columns.filter(
      (c) => !['Kategoriler', 'Alışveriş'].includes(c.title),
    );
    columns = [catCol, ...rest];
  }

  const trustItems: TrustItem[] = [
    {
      title: settings['campaign.shipping.title'] ?? 'Ücretsiz Kargo',
      subtitle: settings['campaign.shipping.subtitle'] ?? '500 TL ve üzeri siparişlerde',
    },
    {
      title: settings['campaign.return.title'] ?? 'Kolay İade',
      subtitle: settings['campaign.return.subtitle'] ?? '14 gün içinde ücretsiz iade',
    },
    {
      title: settings['campaign.payment.title'] ?? 'Güvenli Ödeme',
      subtitle: settings['campaign.payment.subtitle'] ?? 'SSL · Kredi kartı · Havale/EFT',
    },
  ];

  return {
    storeName,
    description:
      settings['footer.description'] ??
      "1998'den beri kaliteli ayakkabı. Kadın, erkek ve çocuk koleksiyonlarımızla her adımda yanınızdayız.",
    email: settings['footer.contact.email'] ?? '',
    phone: settings['footer.contact.phone'] ?? '',
    phoneDigits: normalizePhoneDigits(settings['footer.contact.phone'] ?? ''),
    hours: settings['footer.contact.hours'] ?? '',
    address: settings['footer.contact.address'] ?? '',
    copyright: settings['footer.copyright'] ?? 'Tüm hakları saklıdır.',
    footerBg: settings['footer.background'] ?? settings['store.color.primary'] ?? '#1e3a5f',
    footerTextColor: settings['footer.textColor'] ?? '#f8fafc',
    columns,
    legal: parseJson(settings['footer.legal'], DEFAULT_FOOTER_LEGAL),
    trustItems,
    showTrustBar: settings['footer.showTrustBar'] !== 'false',
    whatsappEnabled: settings['footer.whatsapp.enabled'] !== 'false',
    newsletterEnabled: settings['footer.newsletter.enabled'] !== 'false',
    socialInstagram: settings['footer.social.instagram'] ?? '',
    socialFacebook: settings['footer.social.facebook'] ?? '',
    etbisUrl: settings['footer.etbis.url'] ?? '',
    sitemapLinks: parseJson(settings['footer.sitemap'], DEFAULT_SITEMAP),
  };
}
