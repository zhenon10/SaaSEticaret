'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CartItem } from '@saas/api-client';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Props { item: CartItem }

export default function CartItemRow({ item }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const update = async (quantity: number) => {
    if (quantity < 1) return;
    setLoading(true);
    try {
      await api.cart.updateItem(item.id, { quantity });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    try {
      await api.cart.removeItem(item.id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
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
        <button onClick={() => update(item.quantity - 1)} disabled={loading || item.quantity <= 1} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50">
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <button onClick={() => update(item.quantity + 1)} disabled={loading} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50">
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <span className="w-24 text-right font-semibold">{formatPrice(item.lineTotal)}</span>

      <button onClick={remove} disabled={loading} className="text-muted-foreground hover:text-destructive disabled:opacity-50">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
