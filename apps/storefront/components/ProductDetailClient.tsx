'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AddToCartButton from '@/components/AddToCartButton';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@saas/api-client';

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const images = product.images ?? [];
  const initialImageIndex = images.findIndex((img) => img.isPrimary) ?? 0;
  const [selectedImageIndex, setSelectedImageIndex] = useState(Math.max(initialImageIndex, 0));

  const availableColors = useMemo(() => {
    return product.colors?.length ? product.colors : [];
  }, [product.colors]);

  const [selectedColor, setSelectedColor] = useState<string | undefined>(availableColors[0] ?? undefined);
  
  const sizes = useMemo(() => {
    return product.sizes?.length ? product.sizes : [];
  }, [product.sizes]);
  
  // PROFESYONEL DOKUNUŞ: İlk bedeni otomatik seçmiyoruz (Kullanıcı bilinçli seçmeli)
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  
  // PROFESYONEL DOKUNUŞ: Sepete eklerken beden seçilmemişse gösterilecek hata durumu
  const [sizeError, setSizeError] = useState<string | null>(null);

  // PROFESYONEL DOKUNUŞ: Resim zoom (büyütme) ayarlarını tutacağımız state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: 'center center',
    transform: 'scale(1)',
  });

  const displayedImage = useMemo(() => {
    if (selectedColor) {
      const match = images.find(
        (img) => img.altText?.trim().toLowerCase() === selectedColor.toLowerCase()
      );
      if (match) return match;
    }
    return images[selectedImageIndex] ?? images[0];
  }, [images, selectedColor, selectedImageIndex]);

  // Resim değiştirme işlemi
  const handleNextImage = () => {
    if (images.length <= 1) return;
    const currentIndex = images.findIndex((img) => img.id === displayedImage?.id);
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImage = images[nextIndex];
    setSelectedImageIndex(nextIndex);
    if (nextImage?.altText) setSelectedColor(nextImage.altText);
  };

  // Renk seçme işlemi
  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    const match = images.find(
      (img) => img.altText?.trim().toLowerCase() === color.toLowerCase()
    );
    if (match) {
      setSelectedImageIndex(images.indexOf(match));
    }
  };

  // Beden seçme işlemi (Hata varsa temizlenir)
  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    if (sizeError) setSizeError(null);
  };

  // Sepete eklemeden önce validasyon (doğrulama) işlemi
  const handleAddToCartClick = (e: React.MouseEvent) => {
    if (sizes.length > 0 && !selectedSize) {
      e.preventDefault(); // Tıklamayı durdur ve API isteğini engelle
      setSizeError("Lütfen sepete eklemeden önce bir beden seçiniz.");
    }
  };

  // Fare resmin üzerinde hareket ettikçe çalışacak zoom hesaplaması
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2)', // Büyütme katsayısı
    });
  };

  // Fare resimden çıkınca zoom'u sıfırla
  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── 1. GÖRSELLER ALANI ── */}
        <div className="space-y-4 lg:col-span-1">
          <div 
            className="relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted cursor-crosshair max-w-sm" 
            onClick={handleNextImage}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {displayedImage ? (
              <Image
                src={displayedImage.url}
                alt={displayedImage.altText ?? product.name}
                fill
                className="object-cover transition-transform duration-200 ease-out"
                style={zoomStyle}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Görsel yok
              </div>
            )}
          </div>

          {/* Küçük Resimler (Thumbnails) */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex(index);
                    if (img.altText) setSelectedColor(img.altText);
                  }}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${displayedImage?.id === img.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200 opacity-70 hover:opacity-100'} transition-all`}
                >
                  <Image src={img.url} alt={img.altText ?? ''} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 2. ÜRÜN DETAYLARI VE SATIN ALMA ALANI ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Kategori Linki */}
          {product.category && (
            <a href={`/products?category=${product.category.id}`} className="text-sm font-semibold uppercase tracking-wider text-primary hover:underline">
              {product.category.name}
            </a>
          )}

          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {product.sku && (
            <p className="text-sm text-muted-foreground">Ürün Kodu: {product.sku}</p>
          )}

          {/* Fiyat Alanı */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <Badge variant={(product.inventory?.availableQuantity ?? 0) > 0 ? 'success' : 'destructive'} className="text-xs">
            {(product.inventory?.availableQuantity ?? 0) > 0 ? 'Stokta Var' : 'Tükendi'}
          </Badge>

          {product.description && (
            <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
          )}

          <hr className="my-6 border-gray-100" />

          {/* Renk Seçimi */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900">Renk Seçimi <span className="font-normal text-gray-500">({selectedColor})</span></div>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition-all ${selectedColor === color ? 'border-primary bg-primary text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Beden Seçimi ve Hata Yönetimi */}
          {sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <div className="text-sm font-semibold text-gray-900">Beden Seçimi</div>
                 {sizeError && <span className="text-xs font-bold text-red-500 animate-pulse">{sizeError}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSelectSize(size)}
                    className={`min-w-[3rem] rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                      selectedSize === size 
                        ? 'border-primary bg-primary text-white shadow-sm' 
                        : sizeError 
                          ? 'border-red-300 bg-red-50 text-red-700 hover:border-red-500 hover:bg-red-100' 
                          : 'border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sepete Ekle Butonu */}
          <div className="pt-4" onClick={handleAddToCartClick}>
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              unitPrice={product.price}
              productImage={product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url}
              sku={product.sku ?? undefined}
              color={selectedColor}
              size={selectedSize}
            />
          </div>

        </div>
      </div>
    </div>
  );
}