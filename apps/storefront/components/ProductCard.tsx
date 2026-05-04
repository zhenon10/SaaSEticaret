import Link from 'next/link';
import Image from 'next/image';
import type { ProductListItem } from '@saas/api-client';
import { formatPrice } from '@/lib/utils';
import { Camera, Star } from 'lucide-react';

interface Props { product: ProductListItem }

/**
 * Ürün puanlamasını gösteren yardımcı bileşen.
 * Rating değerine göre yıldızları doldurur.
 */
function Stars({ count = 0, rating = 5 }: { count?: number; rating?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3 w-3 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
}

export default function ProductCard({ product }: Props) {
  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;
  
  // İndirim yüzdesini hesapla
  const discountPercentage = hasDiscount 
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100) 
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-sm border border-gray-100 bg-white transition-shadow hover:shadow-md"
    >
      {/* Görsel Alanı */}
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

        {/* Stokta Yok Katmanı */}
        {!product.isInStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <span className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700">
              Stokta Yok
            </span>
          </div>
        )}

        {/* İndirim Rozeti - Temaya Uygun (bg-primary) */}
        {hasDiscount && (
          <div className="absolute left-2 top-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            %{discountPercentage} İndirim
          </div>
        )}

        {/* Fotoğraf Sayısı */}
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded bg-black/55 px-1.5 py-0.5">
          <Camera className="h-2.5 w-2.5 text-white" />
          <span className="text-[10px] font-medium text-white">1</span>
        </div>
      </div>

      {/* Ürün Bilgileri */}
      <div className="p-3">
        {/* Kategori - Temaya Uygun (text-primary) */}
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {product.categoryName ?? 'YENİ SEZON'}
        </p>

        {/* Ürün Adı */}
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-gray-800">
          {product.name}
        </h3>

        {/* Değerlendirme Yıldızları */}
        <Stars count={product.reviewCount ?? 0} rating={product.rating ?? 5} />

        {/* Fiyat Alanı - Tamamen Merkezi Temaya (bg-primary) Bağlandı */}
        <div className="mt-3 space-y-1">
          {hasDiscount && (
            <p className="text-center text-xs text-gray-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </p>
          )}
          
          <div className="rounded bg-primary px-3 py-2 text-center transition-colors group-hover:brightness-110">
            {hasDiscount && (
              <span className="text-[10px] font-semibold text-white/80">KAMPANYA FİYATI: </span>
            )}
            <span className="text-sm font-bold text-white">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}