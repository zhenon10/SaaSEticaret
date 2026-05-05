import Link from 'next/link';
import Image from 'next/image';
import type { ProductListItem } from '@saas/api-client';
import { formatPrice } from '@/lib/utils';
import { Camera, Star } from 'lucide-react';
import ProductCardSizeSelector from './ProductCardSizeSelector';
import { api } from '@/lib/api';

interface Props { product: ProductListItem }

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

export default async function ProductCard({ product }: Props) {
  let sizes: string[] = [];

  try {
    const fullProduct = await api.catalog.getProductBySlug(product.slug);
    sizes = fullProduct.sizes ?? [];
  } catch (err) {
    console.error('Failed to fetch product sizes:', err);
  }

  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-sm border border-gray-100 bg-white transition-shadow hover:shadow-md">
      
      {/* ── 1. GÖRSEL ALANI VE HIZLI EKLE (OVERLAY) ── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
        
        {/* Sadece Görseli Saran Link (Tıklayınca detaya gider) */}
        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-0">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-300">
              Görsel yok
            </div>
          )}
        </Link>

        {/* Stokta Yok Katmanı */}
        {!product.isInStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 pointer-events-none">
            <span className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700">
              Stokta Yok
            </span>
          </div>
        )}

        {/* İndirim Rozeti */}
        {hasDiscount && (
          <div className="absolute left-2 top-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm pointer-events-none">
            %{discountPercentage} İndirim
          </div>
        )}

        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded bg-black/55 px-1.5 py-0.5 pointer-events-none">
          <Camera className="h-2.5 w-2.5 text-white" />
          <span className="text-[10px] font-medium text-white">1</span>
        </div>

        {/* ── İŞTE SİHİRLİ KISIM: AŞAĞIDAN KAYAN BEDEN SEÇİCİ ── */}
        {sizes.length > 0 && product.isInStock && (
          <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
            {/* 
              ProductCardSizeSelector client component olduğu için 
              tıklama işlemleri (onClick) burada sorunsuz çalışır 
              ve Link ile çakışmaz.
            */}
            <ProductCardSizeSelector
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              unitPrice={product.price}
              productImage={product.primaryImageUrl ?? undefined}
              sizes={sizes}
            />
          </div>
        )}
      </div>

      {/* ── 2. ÜRÜN BİLGİLERİ (İsim, Kategori, Fiyat) ── */}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {product.categoryName ?? 'YENİ SEZON'}
        </p>

        {/* Başlık Linki */}
        <Link href={`/products/${product.slug}`} className="group-hover:text-primary transition-colors">
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-gray-800">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          <Stars count={0} rating={5} />

          {/* Fiyat Alanı - Link'in dışına çıkardık ki tıklama sorunu olmasın */}
          <div className="mt-3 space-y-1">
            {hasDiscount && (
              <p className="text-center text-xs text-gray-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}

            <Link href={`/products/${product.slug}`} className="block">
              <div className="rounded bg-primary px-3 py-2 text-center transition-colors hover:brightness-110">
                {hasDiscount && (
                  <span className="text-[10px] font-semibold text-white/80">KAMPANYA FİYATI: </span>
                )}
                <span className="text-sm font-bold text-white">
                  {formatPrice(product.price)}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}