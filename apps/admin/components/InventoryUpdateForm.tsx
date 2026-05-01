'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';

interface Props { productId: string }

export default function InventoryUpdateForm({ productId }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    const quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity < 0) { setMessage('Geçersiz miktar'); return; }
    setLoading(true);
    setMessage('');
    try {
      await api.catalog.updateInventory(productId, { quantity });
      setMessage('✓');
      setQty('');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Yeni stok"
        className="w-24 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleUpdate}
        disabled={loading || !qty}
        className="rounded px-3 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? '...' : 'Kaydet'}
      </button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}
