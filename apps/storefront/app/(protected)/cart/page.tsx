import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import CartItemRow from '@/components/CartItemRow';

export const metadata: Metadata = { title: 'Sepetim' };

export default async function CartPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('st_at')?.value;

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Sepetiniz</h1>
        <p className="mb-6 text-muted-foreground">Sepetinizi görmek için giriş yapın.</p>
        <Link href="/login" className="inline-flex rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          Giriş Yap
        </Link>
      </div>
    );
  }

  let cart = { id: '', items: [], subtotal: 0, itemCount: 0 };
  try {
    cart = await api.cart.getCart();
  } catch {
    // ignore
  }

  if (cart.items.length === 0) {
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
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Sipariş Özeti</h2>
          <div className="flex justify-between text-sm">
            <span>Ara Toplam</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Kargo</span>
            <span>Ücretsiz</span>
          </div>
          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Toplam</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Siparişi Tamamla
          </Link>
        </div>
      </div>
    </div>
  );
}
