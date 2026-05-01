import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import AddToCartButton from '@/components/AddToCartButton';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.catalog.getProductBySlug(slug);
    return { title: product.name, description: product.description };
  } catch {
    return { title: 'Ürün Bulunamadı' };
  }
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

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const isInStock = (product.inventory?.availableQuantity ?? 0) > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.altText ?? product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Görsel yok
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <div key={img.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border">
                  <Image src={img.url} alt={img.altText ?? ''} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.category && (
            <a href={`/products?category=${product.category.id}`} className="text-sm text-muted-foreground hover:underline">
              {product.category.name}
            </a>
          )}

          <h1 className="text-3xl font-bold">{product.name}</h1>

          {product.sku && (
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <Badge variant={isInStock ? 'success' : 'destructive'}>
            {isInStock ? 'Stokta Var' : 'Stokta Yok'}
          </Badge>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {isInStock && (
            <AddToCartButton productId={product.id} />
          )}
        </div>
      </div>
    </div>
  );
}
