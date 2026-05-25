'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import AddToCartButton from '@/components/AddToCartButton';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductBreadcrumb from '@/components/product/ProductBreadcrumb';
import ProductTrustStrip, { type TrustItem } from '@/components/product/ProductTrustStrip';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import { formatPrice } from '@/lib/utils';
import { getColorSwatchStyle, hasColorSwatch } from '@/lib/colorSwatches';
import type { Product } from '@saas/api-client';
import { ChevronDown, Heart, Minus, Plus, Ruler, Share2 } from 'lucide-react';
import { useFavorites } from '@/components/FavoritesProvider';

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-900"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-5 text-sm leading-relaxed text-gray-600">{children}</div>}
    </div>
  );
}

export interface ProductDetailSections {
  care: string;
  delivery: string;
}

interface Props {
  product: Product;
  whatsappPhone?: string;
  productUrl?: string;
  trustItems: TrustItem[];
  detailSections: ProductDetailSections;
}

export default function ProductDetailClient({
  product,
  whatsappPhone,
  productUrl,
  trustItems,
  detailSections,
}: Props) {
  const { isFavorite, toggle } = useFavorites();
  const favorited = isFavorite(product.id);

  const images = product.images ?? [];
  const availableColors = useMemo(
    () => (product.colors?.length ? product.colors : []),
    [product.colors],
  );
  const sizes = useMemo(() => (product.sizes?.length ? product.sizes : []), [product.sizes]);

  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    availableColors[0] ?? undefined,
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const availableQty = product.inventory?.availableQuantity ?? 0;
  const lowStockThreshold = product.inventory?.lowStockThreshold ?? 5;
  const inStock = availableQty > 0;
  const isLowStock = inStock && availableQty <= lowStockThreshold;

  const hasDiscount =
    !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0;

  const primaryImage =
    product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url;

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    if (sizeError) setSizeError(null);
  };

  const validateSize = (): boolean => {
    if (sizes.length > 0 && !selectedSize) {
      setSizeError('Lütfen sepete eklemeden önce bir numara seçiniz.');
      return false;
    }
    return true;
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((q) => {
      const next = q + delta;
      if (next < 1) return 1;
      if (inStock && next > availableQty) return availableQty;
      return next;
    });
  };

  const cartButtonProps = {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    unitPrice: product.price,
    productImage: primaryImage,
    sku: product.sku ?? undefined,
    color: selectedColor,
    size: selectedSize,
    quantity,
    disabled: !inStock,
    onBeforeAdd: validateSize,
  };

  return (
  <>
    <div className="container mx-auto px-4 pb-28 pt-6 lg:pb-12">
      <ProductBreadcrumb category={product.category} productName={product.name} />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Galeri */}
        <ProductImageGallery
          images={images}
          productName={product.name}
          selectedColor={selectedColor}
          onColorFromImage={setSelectedColor}
        />

        {/* Bilgi */}
        <div className="space-y-5">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="inline-block text-sm font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          {product.sku && (
            <p className="text-xs text-gray-400">Ürün kodu: {product.sku}</p>
          )}

          {/* Fiyat */}
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <span className="rounded-md bg-red-500 px-2 py-0.5 text-sm font-bold text-white">
                  %{discountPercent} indirim
                </span>
              </>
            )}
          </div>

          {/* Stok */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={inStock ? 'success' : 'destructive'} className="text-xs">
              {inStock ? 'Stokta var' : 'Tükendi'}
            </Badge>
            {isLowStock && (
              <span className="text-sm font-medium text-amber-600">
                Son {availableQty} çift — acele edin!
              </span>
            )}
            {!inStock && (
              <Link href="/products" className="text-sm text-primary hover:underline">
                Benzer ürünlere göz at →
              </Link>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Renk */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                Renk: <span className="font-normal text-gray-600">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const selected = selectedColor === color;
                  const swatch = hasColorSwatch(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        selected
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {swatch && (
                        <span
                          className="h-5 w-5 shrink-0 rounded-full border border-gray-200"
                          style={getColorSwatchStyle(color)}
                        />
                      )}
                      {!swatch && color}
                      {swatch && <span className="hidden sm:inline">{color}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Numara */}
          {sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">Numara (EU)</p>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  Beden rehberi
                </button>
              </div>
              {sizeError && (
                <p className="text-xs font-semibold text-red-500">{sizeError}</p>
              )}
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSelectSize(size)}
                    className={`flex h-11 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : sizeError
                          ? 'border-red-200 bg-red-50 text-red-800 hover:border-red-400'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Adet */}
          {inStock && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Adet</p>
              <div className="inline-flex items-center rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Azalt"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-10 w-12 items-center justify-center border-x border-gray-200 text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= availableQty}
                  className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Artır"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Sepete ekle — desktop */}
          <div className="hidden lg:block">
            <AddToCartButton {...cartButtonProps} />
          </div>

          {/* WhatsApp + favori + paylaş */}
          <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() =>
                toggle({
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  productImage: primaryImage,
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                })
              }
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                favorited ? 'text-red-500' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
              {favorited ? 'Favorilerde' : 'Favorilere ekle'}
            </button>
            <button
              type="button"
              onClick={() =>
                navigator.share?.({ title: product.name, url: window.location.href })
              }
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-gray-900"
            >
              <Share2 className="h-4 w-4" />
              Paylaş
            </button>
            {whatsappPhone && (
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  `Merhaba! "${product.name}" hakkında bilgi almak istiyorum.\n${productUrl ?? window.location.href}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-2 rounded-full border border-[#25D366] bg-[#25D366]/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#128C7E] transition-colors hover:bg-[#25D366]/20"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Satıcıya sor
              </a>
            )}
          </div>

          <ProductTrustStrip items={trustItems} />

          {/* Accordion */}
          <div className="border-b border-gray-200">
            <AccordionItem title="Ürün bilgileri" defaultOpen>
              {product.description ? (
                <p className="whitespace-pre-line">{product.description}</p>
              ) : (
                <p className="italic text-gray-400">Ürün açıklaması girilmemiş.</p>
              )}
            </AccordionItem>
            <AccordionItem title="Bakım önerileri">
              <p className="whitespace-pre-line">{detailSections.care}</p>
            </AccordionItem>
            <AccordionItem title="Teslimat ve iade">
              <p className="whitespace-pre-line">{detailSections.delivery}</p>
            </AccordionItem>
          </div>
        </div>
      </div>
    </div>

    {/* Mobil sticky CTA */}
    {inStock && (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="container mx-auto flex items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
            {hasDiscount && (
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <AddToCartButton {...cartButtonProps} compact className="w-full" />
          </div>
        </div>
      </div>
    )}

    <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
  </>
  );
}
