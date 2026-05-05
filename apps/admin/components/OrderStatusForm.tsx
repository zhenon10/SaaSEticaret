'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import type { OrderStatus } from '@saas/api-client';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: ['Refunded'],
  Cancelled: [],
  Refunded: [],
};

const statusLabel: Record<OrderStatus, string> = {
  Pending: 'Beklemede',
  Confirmed: 'Onaylandı',
  Processing: 'İşleniyor',
  Shipped: 'Kargoya Verildi',
  Delivered: 'Teslim Edildi',
  Cancelled: 'İptal Edildi',
  Refunded: 'İade Edildi',
};

interface Props { orderId: string; currentStatus: OrderStatus }

export default function OrderStatusForm({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const available = transitions[currentStatus] ?? [];
  const [status, setStatus] = useState<OrderStatus>(available[0] ?? currentStatus);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (available.length === 0) return null;

  const needsReason = status === 'Cancelled' || status === 'Refunded';

  const handleUpdate = async () => {
    setError('');
    setLoading(true);
    try {
      await api.orders.updateStatus(orderId, { status, reason: reason || undefined });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Güncelleme başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h2 className="font-semibold">Durum Güncelle</h2>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Yeni Durum</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {available.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
        </div>
        {needsReason && (
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Neden (isteğe bağlı)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="İptal / iade nedeni..."
            />
          </div>
        )}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Güncelleniyor...' : 'Güncelle'}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
