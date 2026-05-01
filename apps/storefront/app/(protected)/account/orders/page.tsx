import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@saas/api-client';

export const metadata: Metadata = { title: 'Siparişlerim' };

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  Pending: 'warning',
  Confirmed: 'secondary',
  Processing: 'secondary',
  Shipped: 'default',
  Delivered: 'success',
  Cancelled: 'destructive',
  Refunded: 'outline',
};

export default async function OrdersPage() {
  let orders = { items: [], totalCount: 0 };
  try {
    orders = await api.orders.getOrders({ pageSize: 20 });
  } catch {
    // ignore
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Siparişlerim</h1>

      {orders.items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
          <p>Henüz siparişiniz yok.</p>
          <Link href="/products" className="text-sm text-primary hover:underline">
            Alışverişe Başla →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.items.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl border p-5 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)} · {order.itemCount} ürün</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{formatPrice(order.totalAmount, order.currency)}</span>
                <Badge variant={statusVariant[order.status] ?? 'default'}>{order.statusLabel}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
