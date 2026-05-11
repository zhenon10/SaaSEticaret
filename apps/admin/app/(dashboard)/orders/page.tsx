import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerApi } from '@/lib/server-api';
import { formatPrice, formatDate } from '@/lib/utils';
import type { OrderStatus, OrderListItem, PagedResult } from '@saas/api-client';

export const metadata: Metadata = { title: 'Siparişler' };

const statusColor: Record<OrderStatus, string> = {
  Pending:    'bg-yellow-100 text-yellow-800',
  Confirmed:  'bg-blue-100 text-blue-800',
  Processing: 'bg-indigo-100 text-indigo-800',
  Shipped:    'bg-purple-100 text-purple-800',
  Delivered:  'bg-green-100 text-green-800',
  Cancelled:  'bg-red-100 text-red-800',
  Refunded:   'bg-gray-100 text-gray-800',
};

const statusLabel: Record<OrderStatus, string> = {
  Pending:    'Bekliyor',
  Confirmed:  'Onaylandı',
  Processing: 'Hazırlanıyor',
  Shipped:    'Kargoda',
  Delivered:  'Teslim Edildi',
  Cancelled:  'İptal',
  Refunded:   'İade',
};

interface Props {
  searchParams: Promise<{ status?: OrderStatus; page?: string }>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const api = await getServerApi();

  let result: PagedResult<OrderListItem> = { items: [], totalCount: 0, totalPages: 0, page: 1, pageSize: 20, hasNext: false, hasPrev: false };
  try {
    result = await api.orders.getOrders({ status: params.status, page, pageSize: 20 });
  } catch { /* ignore */ }

  const statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

  return (
    <div className="space-y-4 lg:space-y-6">
      <h1 className="text-2xl font-bold lg:text-3xl">Siparişler</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        <a href="/orders" className={`rounded-full px-3 py-1 text-xs font-medium ${!params.status ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          Tümü
        </a>
        {statuses.map((s) => (
          <a
            key={s}
            href={`/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.status === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
          >
            {statusLabel[s]}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-3 text-left font-medium lg:px-4">Sipariş</th>
              <th className="hidden px-3 py-3 text-left font-medium sm:table-cell lg:px-4">Tarih</th>
              <th className="px-3 py-3 text-center font-medium lg:px-4">Durum</th>
              <th className="hidden px-3 py-3 text-center font-medium md:table-cell lg:px-4">Ödeme</th>
              <th className="hidden px-3 py-3 text-center font-medium md:table-cell lg:px-4">Ürün</th>
              <th className="px-3 py-3 text-right font-medium lg:px-4">Tutar</th>
              <th className="px-3 py-3 text-right font-medium lg:px-4">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Sipariş bulunamadı.</td>
              </tr>
            ) : (
              result.items.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3 lg:px-4">
                    <p className="font-mono text-xs font-medium">{order.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell lg:px-4">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-3 py-3 text-center lg:px-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor[order.status]}`}>
                      {order.statusLabel}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-center md:table-cell lg:px-4">
                    {order.paymentMethod === 'BankTransfer' ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">Havale</span>
                    ) : order.paymentMethod === 'CreditCard' ? (
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">Kart</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 text-center text-muted-foreground md:table-cell lg:px-4">
                    {order.itemCount}
                  </td>
                  <td className="px-3 py-3 text-right font-medium lg:px-4">
                    {formatPrice(order.totalAmount, order.currency)}
                  </td>
                  <td className="px-3 py-3 text-right lg:px-4">
                    <Link href={`/orders/${order.id}`} className="rounded px-2 py-1 text-xs text-primary hover:bg-muted">
                      Detay
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {result.hasPrev && (
            <a href={`/orders?page=${page - 1}`} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">← Önceki</a>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">{page} / {result.totalPages}</span>
          {result.hasNext && (
            <a href={`/orders?page=${page + 1}`} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Sonraki →</a>
          )}
        </div>
      )}
    </div>
  );
}
