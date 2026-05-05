'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { useShipping } from '@/hooks/useShipping';
import { api } from '@/lib/api';
import type { Cart, CartItem } from '@saas/api-client';
import type { GuestCartItem } from '@saas/api-client';
import { formatPrice } from '@/lib/utils';

// ── Boş sepet ──────────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <ShoppingBag className="h-10 w-10 text-gray-400" />
      </div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">Sepetiniz boş</h1>
      <p className="mb-8 text-sm text-gray-500">Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayabilirsiniz.</p>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Alışverişe Başla
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Misafir ürün kartı ──────────────────────────────────────────────────────────
function GuestItemCard({
  item,
  onUpdate,
  onRemove,
}: {
  item: GuestCartItem;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-xl border bg-white p-3 sm:p-4">
      {/* Görsel */}
      <Link href={`/products/${item.productSlug}`} className="shrink-0">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-28">
          {item.productImage ? (
            <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
      </Link>

      {/* İçerik */}
      <div className="flex flex-1 flex-col min-w-0 gap-1">
        {/* Üst satır: isim + sil */}
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${item.productSlug}`}>
            <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-primary transition-colors">
              {item.productName}
            </p>
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Varyant bilgisi */}
        {(item.color || item.size) && (
          <p className="text-xs text-gray-500">
            {item.color && <span>Renk: {item.color}</span>}
            {item.color && item.size && <span> · </span>}
            {item.size && <span>Beden: {item.size}</span>}
          </p>
        )}

        {/* Alt satır: miktar + fiyat */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 rounded-lg border">
            <button
              type="button"
              onClick={() => item.quantity > 1 && onUpdate(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Üye ürün kartı ─────────────────────────────────────────────────────────────
function UserItemCard({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-xl border bg-white p-3 sm:p-4">
      <Link href={`/products/${item.productSlug}`} className="shrink-0">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-28">
          {item.productImage ? (
            <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col min-w-0 gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${item.productSlug}`}>
            <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-primary transition-colors">
              {item.productName}
            </p>
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {(item.color || item.size) && (
          <p className="text-xs text-gray-500">
            {item.color && <span>Renk: {item.color}</span>}
            {item.color && item.size && <span> · </span>}
            {item.size && <span>Beden: {item.size}</span>}
          </p>
        )}

        {!item.isAvailable && (
          <p className="text-xs font-medium text-red-500">Stok yetersiz</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 rounded-lg border">
            <button
              type="button"
              onClick={() => item.quantity > 1 && onUpdate(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-sm font-bold text-gray-900">{formatPrice(item.lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Sipariş özeti ──────────────────────────────────────────────────────────────
function CartSummary({ subtotal, itemCount }: { subtotal: number; itemCount: number }) {
  const { shippingCost, isFree, remaining, freeThreshold } = useShipping(subtotal);
  const total = subtotal + shippingCost;

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-6 space-y-4">
      <h2 className="text-base font-bold text-gray-900">Sipariş Özeti</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Ürünler ({itemCount} adet)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Kargo</span>
          {isFree
            ? <span className="font-medium text-green-600">Ücretsiz</span>
            : <span>{formatPrice(shippingCost)}</span>
          }
        </div>
      </div>

      {!isFree && freeThreshold > 0 && remaining > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-xs text-gray-600">
          <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Ücretsiz kargo için{' '}
            <span className="font-semibold text-primary">{formatPrice(remaining)}</span>{' '}
            daha ekleyin.
          </span>
        </div>
      )}

      <div className="border-t pt-3 flex justify-between text-base font-bold text-gray-900">
        <span>Toplam</span>
        <span>{formatPrice(total)}</span>
      </div>

      <Link
        href="/checkout"
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Siparişi Tamamla
        <ArrowRight className="h-4 w-4" />
      </Link>

      <Link
        href="/products"
        className="flex w-full items-center justify-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        Alışverişe Devam Et
      </Link>
    </div>
  );
}

// ── Misafir sepeti ─────────────────────────────────────────────────────────────
function GuestCartView() {
  const { guestItems, removeGuestItem, updateGuestItem, subtotal, itemCount } = useCart();

  if (guestItems.length === 0) return <EmptyCart />;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
        Sepetim
        <span className="ml-2 text-sm font-normal text-gray-400">({guestItems.length} ürün)</span>
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Ürün listesi */}
        <div className="flex-1 space-y-3">
          {guestItems.map((item) => (
            <GuestItemCard
              key={item.localId}
              item={item}
              onUpdate={(qty) => updateGuestItem(item.localId, qty)}
              onRemove={() => removeGuestItem(item.localId)}
            />
          ))}
        </div>

        {/* Özet — mobilde altta, masaüstünde sticky sağ kolon */}
        <div className="w-full lg:w-80 lg:shrink-0 lg:sticky lg:top-4">
          <CartSummary subtotal={subtotal} itemCount={itemCount} />
        </div>
      </div>
    </div>
  );
}

// ── Üye sepeti ─────────────────────────────────────────────────────────────────
function UserCartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshUserCart } = useCart();

  const fetchCart = async () => {
    try {
      setCart(await api.cart.getCart());
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-sm text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) return <EmptyCart />;

  const update = async (itemId: string, qty: number) => {
    await api.cart.updateItem(itemId, { quantity: qty });
    fetchCart();
    refreshUserCart();
  };

  const remove = async (itemId: string) => {
    await api.cart.removeItem(itemId);
    fetchCart();
    refreshUserCart();
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
        Sepetim
        <span className="ml-2 text-sm font-normal text-gray-400">({cart.items.length} ürün)</span>
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Ürün listesi */}
        <div className="flex-1 space-y-3">
          {cart.items.map((item) => (
            <UserItemCard
              key={item.id}
              item={item}
              onUpdate={(qty) => update(item.id, qty)}
              onRemove={() => remove(item.id)}
            />
          ))}
        </div>

        {/* Özet */}
        <div className="w-full lg:w-80 lg:shrink-0 lg:sticky lg:top-4">
          <CartSummary subtotal={cart.subtotal} itemCount={cart.itemCount} />
        </div>
      </div>
    </div>
  );
}

// ── Sayfa girişi ───────────────────────────────────────────────────────────────
export default function CartPage() {
  const { isGuest, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-sm text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  return isGuest ? <GuestCartView /> : <UserCartView />;
}
