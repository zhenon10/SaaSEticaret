import Link from 'next/link';
import { api } from '@/lib/api';
import { buildFooterViewModel } from '@/lib/footer';
import { resolveCategoryHref } from '@/lib/categories';
import FooterTrustBar from '@/components/footer/FooterTrustBar';
import FooterMobile from '@/components/footer/FooterMobile';
import FooterNewsletter from '@/components/footer/FooterNewsletter';
import FooterSocial from '@/components/footer/FooterSocial';
import FooterContact from '@/components/footer/FooterContact';
import FooterPaymentBadges from '@/components/footer/FooterPaymentBadges';
import FooterSitemap from '@/components/footer/FooterSitemap';
import type { FooterColumn } from '@/lib/footer';

function DesktopColumn({ col, categories }: { col: FooterColumn; categories: Parameters<typeof resolveCategoryHref>[1] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h4>
      <ul className="space-y-2 text-sm text-white/75">
        {col.links.map((l) => (
          <li key={`${l.label}-${l.href}`}>
            <Link
              href={resolveCategoryHref(l.href, categories)}
              className="transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer() {
  let settings: Record<string, string> = {};
  let categories: Awaited<ReturnType<typeof api.catalog.getCategories>> = [];

  try {
    [settings, categories] = await Promise.all([
      api.settings.getAll(),
      api.catalog.getCategories(),
    ]);
    categories = categories.filter((c) => c.isActive);
  } catch { /* defaults */ }

  const data = buildFooterViewModel(settings, categories);

  const mobileColumns = data.columns.map((col) => ({
    ...col,
    links: col.links.map((l) => ({
      ...l,
      href: resolveCategoryHref(l.href, categories),
    })),
  }));

  return (
    <footer className="text-white" style={{ backgroundColor: data.footerBg, color: data.footerTextColor }}>
      {data.showTrustBar && <FooterTrustBar items={data.trustItems} />}

      <div className="container mx-auto px-4 py-10 lg:py-12">
        {/* Marka — mobil üst */}
        <div className="mb-8 lg:mb-10">
          <div className="max-w-sm">
            <Link href="/" className="text-2xl font-extrabold text-white transition-opacity hover:opacity-90">
              {data.storeName}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{data.description}</p>
            <div className="mt-4">
              <FooterSocial instagram={data.socialInstagram} facebook={data.socialFacebook} />
            </div>
          </div>
        </div>

        {/* Mobil accordion */}
        <FooterMobile
          columns={mobileColumns}
          email={data.email}
          phone={data.phone}
          phoneDigits={data.phoneDigits}
          hours={data.hours}
          address={data.address}
          whatsappEnabled={data.whatsappEnabled}
          newsletterEnabled={data.newsletterEnabled}
          storeName={data.storeName}
        />

        {/* Desktop grid */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <FooterContact
              email={data.email}
              phone={data.phone}
              phoneDigits={data.phoneDigits}
              hours={data.hours}
              address={data.address}
              whatsappEnabled={data.whatsappEnabled}
            />
          </div>
          {data.columns.map((col, i) => (
            <div key={col.title} className="lg:col-span-2">
              <DesktopColumn col={col} categories={categories} />
            </div>
          ))}
          {data.newsletterEnabled && (
            <div className="lg:col-span-3">
              <FooterNewsletter storeName={data.storeName} />
            </div>
          )}
        </div>
      </div>

      <FooterSitemap links={data.sitemapLinks} />
      <FooterPaymentBadges />

      {data.etbisUrl && (
        <div className="container mx-auto flex justify-center px-4 pb-4">
          <a
            href={data.etbisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            ETBİS Kayıtlıdır
          </a>
        </div>
      )}

      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/50 sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} {data.storeName}. {data.copyright}
          </p>
          <nav className="flex flex-wrap justify-center gap-4">
            {data.legal.map((l) => (
              <Link key={l.label} href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
