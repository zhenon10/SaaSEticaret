import Link from 'next/link';
import Image from 'next/image';
import type { ProductListItem } from '@saas/api-client';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props { product: ProductListItem }

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/products/${product.slug}`} className="group block rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-muted">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Görsel yok</div>
        )}
        {!product.isInStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="destructive">Stokta Yok</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.categoryName}</p>
        <h3 className="font-semibold line-clamp-2 text-sm mb-2">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
