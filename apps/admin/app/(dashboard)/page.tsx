import type { Metadata } from 'next';
import { getServerApi } from '@/lib/server-api';
import { formatPrice } from '@/lib/utils';
import { Package, ShoppingBag, Tags, Warehouse } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };

async function getStats() {
  const api = await getServerApi();
  try {
    const [products, orders, categories] = await Promise.all([
      api.catalog.getProducts({ pageSize: 1 }),
      api.orders.getOrders({ pageSize: 1 }),
      api.catalog.getCategories(),
    ]);
    return {
      productCount: products.totalCount,
      orderCount: orders.totalCount,
      categoryCount: categories.length,
    };
  } catch {
    return { productCount: 0, orderCount: 0, categoryCount: 0 };
  }
}

async function getRecentOrders() {
  const api = await getServerApi();
  try {
    const result = await api.orders.getOrders({ pageSize: 5 });
    return result.items;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [stats, recentOrders] = await Promise.all([getStats(), getRecentOrders()]);

  const cards = [
    { label: 'Toplam Ürün', value: stats.productCount, icon: Package, color: 'text-blue-600' },
    { label: 'Toplam Sipariş', value: stats.orderCount, icon: ShoppingBag, color: 'text-green-600' },
    { label: 'Kategori', value: stats.categoryCount, icon: Tags, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
              </div>
              <Icon className={`h-8 w-8 ${color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Son Siparişler</h2>
        {recentOrders.length === 0 ? (
          <p className="text-muted-foreground">Sipariş yok.</p>
        ) : (
          <div className="rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Sipariş No</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                  <th className="px-4 py-3 text-left font-medium">Ürün</th>
                  <th className="px-4 py-3 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <a href={`/orders/${order.id}`} className="text-primary hover:underline font-mono text-xs">
                        {order.orderNumber}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">{order.statusLabel}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.itemCount} ürün</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(order.totalAmount, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
