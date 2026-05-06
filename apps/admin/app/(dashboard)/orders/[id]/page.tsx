import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerApi } from '@/lib/server-api';
import { formatPrice, formatDate } from '@/lib/utils';
import OrderStatusForm from '@/components/OrderStatusForm';
import type { OrderStatus, PaymentMethod } from '@saas/api-client';

export const metadata: Metadata = { title: 'Sipariş Detayı' };

interface Props { params: Promise<{ id: string }> }

const paymentMethodLabel: Record<PaymentMethod, string> = {
  CreditCard:   'Kredi / Banka Kartı (İyzico)',
  BankTransfer: 'Havale / EFT',
};

const paymentMethodColor: Record<PaymentMethod, string> = {
  CreditCard:   'bg-purple-100 text-purple-800',
  BankTransfer: 'bg-blue-100 text-blue-800',
};

const statusColor: Record<OrderStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Processing: 'bg-indigo-100 text-indigo-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Refunded: 'bg-gray-100 text-gray-800',
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const api = await getServerApi();

  let order;
  try {
    order = await api.orders.getOrderById(id);
  } catch {
    notFound();
  }

  if (!order) notFound();

  const addr = order.shippingAddress;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor[order.status]}`}>
          {order.statusLabel}
        </span>
      </div>

      {/* Payment method badge */}
      {order.paymentMethod && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentMethodColor[order.paymentMethod]}`}>
            {paymentMethodLabel[order.paymentMethod]}
          </span>
        </div>
      )}

      {/* Status update */}
      <OrderStatusForm orderId={order.id} currentStatus={order.status} />

      {/* Items */}
      <section className="rounded-xl border">
        <h2 className="border-b px-4 py-3 font-semibold">Ürünler</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.productName}</p>
                  {item.productSku && <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity} adet</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatPrice(item.unitPrice, order.currency)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(item.totalPrice, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals + Address side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border p-4 space-y-2 text-sm">
          <h2 className="font-semibold mb-3">Tutar Özeti</h2>
          <div className="flex justify-between"><span>Ara Toplam</span><span>{formatPrice(order.subtotal, order.currency)}</span></div>
          {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>İndirim</span><span>-{formatPrice(order.discountAmount, order.currency)}</span></div>}
          {order.taxAmount > 0 && <div className="flex justify-between text-muted-foreground"><span>KDV</span><span>{formatPrice(order.taxAmount, order.currency)}</span></div>}
          {order.shippingAmount > 0 && <div className="flex justify-between text-muted-foreground"><span>Kargo</span><span>{formatPrice(order.shippingAmount, order.currency)}</span></div>}
          <div className="flex justify-between border-t pt-2 font-bold"><span>Toplam</span><span>{formatPrice(order.totalAmount, order.currency)}</span></div>
        </section>

        <section className="rounded-xl border p-4 text-sm">
          <h2 className="font-semibold mb-3">Teslimat Adresi</h2>
          <p className="font-medium">{addr.fullName}</p>
          <p className="text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
          <p className="text-muted-foreground">{addr.city} / {addr.state}, {addr.postalCode}</p>
          <p className="text-muted-foreground">{addr.email}</p>
          <p className="text-muted-foreground">{addr.phone}</p>
        </section>
      </div>

      {order.cancelReason && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <strong>İptal nedeni:</strong> {order.cancelReason}
        </div>
      )}
    </div>
  );
}
