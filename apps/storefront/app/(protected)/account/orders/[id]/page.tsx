import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@saas/api-client';

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Sipariş Detayı' };

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  Pending: 'warning', Confirmed: 'secondary', Processing: 'secondary',
  Shipped: 'default', Delivered: 'success', Cancelled: 'destructive', Refunded: 'outline',
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order;
  try {
    order = await api.orders.getOrderById(id);
  } catch {
    notFound();
  }

  if (!order) notFound();

  const addr = order.shippingAddress;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <Badge variant={statusVariant[order.status] ?? 'default'}>{order.statusLabel}</Badge>
      </div>

      <p className="mb-8 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>

      {/* Items */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Ürünler</h2>
        <div className="divide-y rounded-xl border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{item.productName}</p>
                {item.productSku && <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>}
                <p className="text-sm text-muted-foreground">{item.quantity} × {formatPrice(item.unitPrice, order.currency)}</p>
              </div>
              <span className="font-semibold">{formatPrice(item.totalPrice, order.currency)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Totals */}
      <section className="mb-8 rounded-xl border p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Ara Toplam</span><span>{formatPrice(order.subtotal, order.currency)}</span>
        </div>
        {order.shippingAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span>Kargo</span><span>{formatPrice(order.shippingAmount, order.currency)}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span>KDV</span><span>{formatPrice(order.taxAmount, order.currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Toplam</span><span>{formatPrice(order.totalAmount, order.currency)}</span>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-xl border p-5">
        <h2 className="mb-2 text-lg font-semibold">Teslimat Adresi</h2>
        <p className="text-sm">{addr.fullName}</p>
        <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
        <p className="text-sm text-muted-foreground">{addr.city} / {addr.state}, {addr.postalCode}</p>
        <p className="text-sm text-muted-foreground">{addr.phone}</p>
      </section>

      {order.cancelReason && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <strong>İptal nedeni:</strong> {order.cancelReason}
        </div>
      )}
    </div>
  );
}
