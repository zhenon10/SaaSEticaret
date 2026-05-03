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
  
  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0] ?? undefined);

  const displayedImage = useMemo(() => {
    if (selectedColor) {
      const match = images.find(
        (img) => img.altText?.trim().toLowerCase() === selectedColor.toLowerCase()
      );
      if (match) return match;
    }
    return images[selectedImageIndex] ?? images[0];
  }, [images, selectedColor, selectedImageIndex]);

  const handleNextImage = () => {
    if (images.length <= 1) return;
    const currentIndex = images.findIndex((img) => img.id === displayedImage?.id);
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImage = images[nextIndex];
    setSelectedImageIndex(nextIndex);
    if (nextImage?.altText) setSelectedColor(nextImage.altText);
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    const match = images.find(
      (img) => img.altText?.trim().toLowerCase() === color.toLowerCase()
    );
    if (match) {
      setSelectedImageIndex(images.indexOf(match));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted cursor-pointer max-w-sm" onClick={handleNextImage}>
            {displayedImage ? (
              <Image
                src={displayedImage.url}
                alt={displayedImage.altText ?? product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Görsel yok
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex(index);
                    if (img.altText) setSelectedColor(img.altText);
                  }}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${displayedImage?.id === img.id ? 'border-primary' : 'border-transparent'}`}
                >
                  <Image src={img.url} alt={img.altText ?? ''} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
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

          <Badge variant={(product.inventory?.availableQuantity ?? 0) > 0 ? 'success' : 'destructive'}>
            {(product.inventory?.availableQuantity ?? 0) > 0 ? 'Stokta Var' : 'Stokta Yok'}
          </Badge>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {availableColors.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Renk Seçimi</div>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${selectedColor === color ? 'border-primary bg-primary/10' : 'border-input bg-transparent hover:bg-muted'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Beden Seçimi</div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${selectedSize === size ? 'border-primary bg-primary/10' : 'border-input bg-transparent hover:bg-muted'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AddToCartButton productId={product.id} color={selectedColor} size={selectedSize} />
        </div>
      </div>
    </div>
  );
}
