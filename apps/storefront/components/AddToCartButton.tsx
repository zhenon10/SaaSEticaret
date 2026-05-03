'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import { Button } from '@/components/ui/button';

interface Props { productId: string; color?: string; size?: string }

export default function AddToCartButton({ productId, color, size }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    setLoading(true);
    setMessage('');
    try {
      await api.cart.addItem({ productId, quantity: 1, color, size });
      setMessage('Sepete eklendi!');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login';
        return;
      }
      setMessage(e instanceof ApiError ? e.message : 'Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleAdd} disabled={loading} size="lg" className="w-full gap-2">
        <ShoppingCart className="h-4 w-4" />
        {loading ? 'Ekleniyor...' : 'Sepete Ekle'}
      </Button>
      {message && <p className="text-sm text-center text-muted-foreground">{message}</p>}
    </div>
  );
}
