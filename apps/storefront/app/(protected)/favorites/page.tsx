'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useFavorites } from '@/components/FavoritesProvider';
import { formatPrice } from '@/lib/utils';

export default function FavoritesPage() {
  const { items, remove } = useFavorites();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart className="mx-auto mb-4 h-16 w-16 text-gray-200" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Favorileriniz boş</h1>
        <p className="mb-8 text-gray-500">Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <ShoppingBag className="h-4 w-4" />
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Favorilerim
          <span className="ml-2 text-base font-normal text-gray-400">({items.length} ürün)</span>
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.productId} className="group relative rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Ürün Görseli */}
            <Link href={`/products/${item.productSlug}`}>
              <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <ShoppingBag className="h-12 w-12" />
                  </div>
                )}
              </div>
            </Link>

            {/* Favoriden Çıkar Butonu */}
            <button
              type="button"
              onClick={() => remove(item.productId)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-gray-400 hover:text-red-500 transition-colors"
              title="Favorilerden çıkar"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Ürün Bilgileri */}
            <div className="p-3">
              <Link href={`/products/${item.productSlug}`}>
                <h2 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-primary transition-colors">
                  {item.productName}
                </h2>
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{formatPrice(item.price)}</span>
                {item.compareAtPrice && item.compareAtPrice > item.price && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(item.compareAtPrice)}</span>
                )}
              </div>
              <Link
                href={`/products/${item.productSlug}`}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-primary py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Ürünü İncele
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
