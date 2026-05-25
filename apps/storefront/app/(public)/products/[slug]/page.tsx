import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import ProductDetailClient, {
  type ProductDetailSections,
} from '@/components/ProductDetailClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import type { TrustItem } from '@/components/product/ProductTrustStrip';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kumandacibaba.com';

const DEFAULT_CARE = `• Sneaker ve spor ayakkabı: Nemli bezle silin, makinede yıkamayın.
• Deri ve nubuk: Özel deri/nubuk spreyi kullanın, doğrudan güneşte kurutmayın.
• Botlar: Islakken doğal kurutun; su itici sprey önerilir.
• Uzun süre giymeyecekseniz ayakkabı ağacı veya kağıt ile formunu koruyun.`;

const DEFAULT_DELIVERY = `• Siparişler 1–3 iş günü içinde kargoya verilir.
• 500 TL ve üzeri siparişlerde kargo ücretsizdir.
• Ürün tesliminden itibaren 14 gün içinde iade hakkınız vardır.
• Ayakkabılar orijinal kutusunda ve kullanılmamış olmalıdır.`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.catalog.getProductBySlug(slug);
    const url         = `${SITE_URL}/products/${slug}`;
    const description = product.description
      ? product.description.slice(0, 160)
      : `${product.name} — en uygun fiyatla satın al`;
    const image = product.images?.[0]?.url ?? '';

    return {
      title:      product.name,
      description,
      alternates: { canonical: url },
      openGraph: {
        title:       product.name,
        description,
        url,
        type:        'website',
        images:      image ? [{ url: image, alt: product.name }] : [],
      },
      twitter: {
        card:        'summary_large_image',
        title:       product.name,
        description,
        images:      image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Ürün Bulunamadı' };
  }
}

function buildTrustItems(settings: Record<string, string>): TrustItem[] {
  return [
    {
      title:    settings['campaign.shipping.title']    ?? 'Ücretsiz kargo',
      subtitle: settings['campaign.shipping.subtitle'] ?? '500 TL ve üzeri siparişlerde',
    },
    {
      title:    settings['campaign.return.title']    ?? 'Kolay iade',
      subtitle: settings['campaign.return.subtitle'] ?? '14 gün içinde ücretsiz iade',
    },
    {
      title:    settings['campaign.payment.title']    ?? 'Güvenli ödeme',
      subtitle: settings['campaign.payment.subtitle'] ?? 'SSL ile şifrelenmiş ödeme',
    },
  ];
}

function buildDetailSections(settings: Record<string, string>): ProductDetailSections {
  return {
    care:     settings['product.detail.care']     ?? DEFAULT_CARE,
    delivery: settings['product.detail.delivery'] ?? DEFAULT_DELIVERY,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  let product;
  try {
    product = await api.catalog.getProductBySlug(slug);
  } catch {
    notFound();
  }

  if (!product) notFound();

  let settings: Record<string, string> = {};
  let relatedProducts: Awaited<ReturnType<typeof api.catalog.getProducts>>['items'] = [];

  try {
    settings = await api.settings.getAll();
  } catch { /* defaults */ }

  if (product.categoryId) {
    try {
      const related = await api.catalog.getProducts({
        categoryId: product.categoryId,
        isActive:   true,
        pageSize:   5,
      });
      relatedProducts = related.items.filter((p) => p.id !== product.id).slice(0, 4);
    } catch { /* skip */ }
  }

  let whatsappPhone = '';
  try {
    const raw = settings['footer.contact.phone'] ?? '';
    const digits = raw.replace(/\D/g, '');
    whatsappPhone = digits.startsWith('0') ? '90' + digits.slice(1) : digits;
  } catch { /* no phone */ }

  const url         = `${SITE_URL}/products/${slug}`;
  const description = product.description ?? `${product.name} — en uygun fiyatla satın al`;
  const images      = product.images?.map((i) => i.url) ?? [];
  const inStock     = (product.inventory?.availableQuantity ?? 0) > 0;

  const jsonLd = {
    '@context':  'https://schema.org',
    '@type':     'Product',
    name:        product.name,
    description,
    image:       images,
    sku:         product.sku,
    url,
    offers: {
      '@type':       'Offer',
      price:         product.price,
      priceCurrency: 'TRY',
      availability:  inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url,
      ...(product.compareAtPrice
        ? { priceValidUntil: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10) }
        : {}),
    },
    ...(product.category ? { category: product.category.name } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient
        product={product}
        whatsappPhone={whatsappPhone}
        productUrl={url}
        trustItems={buildTrustItems(settings)}
        detailSections={buildDetailSections(settings)}
      />
      <RelatedProducts products={relatedProducts} />
    </>
  );
}
