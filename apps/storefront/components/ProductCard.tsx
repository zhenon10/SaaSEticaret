import Link from 'next/link';
import Image from 'next/image';
import type { ProductListItem } from '@saas/api-client';
import { formatPrice } from '@/lib/utils';
import { Camera } from 'lucide-react';

interface Props { product: ProductListItem }

function Stars({ count = 0 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-400">({count})</span>
      <Camera className="ml-0.5 h-3 w-3 text-gray-300" />
    </div>
  );
}

export default function ProductCard({ product }: Props) {
  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-sm border border-gray-100 bg-white transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-300">
            Görsel yok
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.isInStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700">
              Stokta Yok
            </span>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            %{Math.round((1 - product.price / product.compareAtPrice!) * 100)} İndirim
          </div>
        )}

        {/* Photo count */}
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded bg-black/55 px-1.5 py-0.5">
          <Camera className="h-2.5 w-2.5 text-white" />
          <span className="text-[10px] font-medium text-white">1</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Category / season tag */}
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {product.categoryName ?? 'YENİ SEZON'}
        </p>

        {/* Name */}
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-gray-800">
          {product.name}
        </h3>

        {/* Stars */}
        <Stars count={0} />

        {/* Price */}
        <div className="mt-3 space-y-1">
          {hasDiscount && (
            <p className="text-center text-xs text-gray-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </p>
          )}
          <div className="rounded bg-red-600 px-3 py-2 text-center">
            {hasDiscount && (
              <span className="text-xs font-semibold text-red-100">KAMPANYA FİYATI: </span>
            )}
            <span className="text-sm font-bold text-white">{formatPrice(product.price)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
