'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ProductListItem, Product } from '@saas/api-client';
import { formatPrice } from '@/lib/utils';
import { Camera, Star, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';

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

export default function ProductCard({ product }: Props) {
  const [fullProduct, setFullProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoadingProduct(true);
        const data = await api.catalog.getProductBySlug(product.slug);
        setFullProduct(data);
        if (data.sizes?.length) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [product.slug]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedSize) {
      setMessage('Lütfen beden seçin');
      setMessageType('error');
      return;
    }

    setIsAddingToCart(true);
    setMessage('');

    try {
      await api.cart.addItem({ productId: product.id, quantity: 1, size: selectedSize });
      setMessage('Sepete eklendi!');
      setMessageType('success');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login';
        return;
      }
      setMessage(e instanceof ApiError ? e.message : 'Hata oluştu.');
      setMessageType('error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0;

  const sizes = fullProduct?.sizes ?? [];

  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-gray-100 bg-white transition-shadow hover:shadow-md">
      {/* Link wrapper for image and basic info - still navigable */}
      <Link
        href={`/products/${product.slug}`}
        className="flex-1 flex flex-col"
        onClick={(e) => {
          if (sizes.length > 0) {
            e.preventDefault();
          }
        }}
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

          {!product.isInStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
              <span className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700">
                Stokta Yok
              </span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute left-2 top-2 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              %{discountPercentage} İndirim
            </div>
          )}

          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded bg-black/55 px-1.5 py-0.5">
            <Camera className="h-2.5 w-2.5 text-white" />
            <span className="text-[10px] font-medium text-white">1</span>
          </div>
        </div>

        {/* Ürün Bilgileri */}
        <div className="p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {product.categoryName ?? 'YENİ SEZON'}
          </p>

          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-gray-800">
            {product.name}
          </h3>

          <Stars count={0} rating={5} />

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

      {/* Size Selection & Add to Cart Section - Non-navigable */}
      {sizes.length > 0 && (
        <div className="border-t border-gray-100 p-3 space-y-2">
          {isLoadingProduct ? (
            <div className="text-xs text-gray-400 text-center py-2">Yükleniyor...</div>
          ) : (
            <>
              <div className="text-xs font-medium text-gray-700 mb-1">Beden Seçin:</div>
              <div className="flex flex-wrap gap-1">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedSize(size);
                      setMessage('');
                    }}
                    className={`flex-1 min-w-[40px] rounded border px-2 py-1 text-xs transition ${
                      selectedSize === size
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`w-full mt-2 rounded px-3 py-1.5 text-xs font-medium transition flex items-center justify-center gap-1 ${
                  isAddingToCart
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:brightness-110'
                }`}
              >
                <ShoppingCart className="h-3 w-3" />
                {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
              </button>

              {message && (
                <p className={`text-xs text-center ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}