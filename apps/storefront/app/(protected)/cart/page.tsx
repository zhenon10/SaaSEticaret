'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { useShipping } from '@/hooks/useShipping';
import { api } from '@/lib/api';
import type { Cart } from '@saas/api-client';
import { formatPrice } from '@/lib/utils';

function GuestCartView() {
  const { guestItems, removeGuestItem, updateGuestItem, subtotal } = useCart();

  if (guestItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Sepetiniz Boş</h1>
        <p className="mb-6 text-muted-foreground">Sepetinize ürün ekleyin.</p>
        <Link href="/products" className="inline-flex rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          Ürünleri Keşfet
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Sepetim</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {guestItems.map((item) => (
            <div key={item.localId} className="flex items-center gap-4 rounded-xl border p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.productImage ? (
                  <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Görsel yok</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.productName}</p>
                {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                {(item.color || item.size) && (
                  <p className="text-xs text-muted-foreground">
                    {item.color && <>Renk: {item.color}</>}
                    {item.color && item.size && ' • '}
                    {item.size && <>Beden: {item.size}</>}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{formatPrice(item.unitPrice)} / adet</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => item.quantity > 1 && updateGuestItem(item.localId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateGuestItem(item.localId, item.quantity + 1)}
                  className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <span className="w-24 text-right font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
              <button onClick={() => removeGuestItem(item.localId)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <CartSummary subtotal={subtotal} />
      </div>
    </div>
  );
}

function UserCartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshUserCart } = useCart();

  const fetchCart = async () => {
    try {
      const data = await api.cart.getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  if (loading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Yükleniyor...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Sepetiniz Boş</h1>
        <p className="mb-6 text-muted-foreground">Sepetinize ürün ekleyin.</p>
        <Link href="/products" className="inline-flex rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          Ürünleri Keşfet
        </Link>
      </div>
    );
  }

  const update = async (itemId: string, quantity: number) => {
    await api.cart.updateItem(itemId, { quantity });
    fetchCart();
    refreshUserCart();
  };

  const remove = async (itemId: string) => {
    await api.cart.removeItem(itemId);
    fetchCart();
    refreshUserCart();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Sepetim</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.productImage ? (
                  <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Görsel yok</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.productName}</p>
                {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                {(item.color || item.size) && (
                  <p className="text-xs text-muted-foreground">
                    {item.color && <>Renk: {item.color}</>}
                    {item.color && item.size && ' • '}
                    {item.size && <>Beden: {item.size}</>}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{formatPrice(item.unitPrice)} / adet</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => item.quantity > 1 && update(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => update(item.id, item.quantity + 1)} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-muted">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <span className="w-24 text-right font-semibold">{formatPrice(item.lineTotal)}</span>
              <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <CartSummary subtotal={cart.subtotal} />
      </div>
    </div>
  );
}

function CartSummary({ subtotal }: { subtotal: number }) {
  const { shippingCost, isFree, remaining, freeThreshold } = useShipping(subtotal);

  return (
    <div className="h-fit rounded-xl border p-6 space-y-4">
      <h2 className="text-lg font-semibold">Sipariş Özeti</h2>
      <div className="flex justify-between text-sm">
        <span>Ara Toplam</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Kargo</span>
        {isFree
          ? <span className="text-green-600 font-medium">Ücretsiz</span>
          : <span>{formatPrice(shippingCost)}</span>
        }
      </div>
      {!isFree && freeThreshold > 0 && remaining > 0 && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          Ücretsiz kargo için <span className="font-semibold text-primary">{formatPrice(remaining)}</span> daha ekleyin.
        </p>
      )}
      <div className="border-t pt-4 flex justify-between font-semibold">
        <span>Toplam</span>
        <span>{formatPrice(subtotal + shippingCost)}</span>
      </div>
      <Link
        href="/checkout"
        className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Siparişi Tamamla
      </Link>
    </div>
  );
}

export default function CartPage() {
  const { isGuest, isLoading } = useCart();

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return isGuest ? <GuestCartView /> : <UserCartView />;
}
