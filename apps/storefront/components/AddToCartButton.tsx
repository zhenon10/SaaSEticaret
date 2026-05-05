'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/CartProvider';

interface Props {
  productId: string;
  productName: string;
  productSlug: string;
  unitPrice: number;
  productImage?: string;
  sku?: string;
  color?: string;
  size?: string;
}

export default function AddToCartButton({
  productId, productName, productSlug, unitPrice, productImage, sku, color, size,
}: Props) {
  const { isGuest, addGuestItem, refreshUserCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (isGuest) {
        addGuestItem({ productId, productName, productSlug, unitPrice, productImage, sku, color, size, quantity: 1 });
        setMessage('Sepete eklendi!');
      } else {
        await api.cart.addItem({ productId, quantity: 1, color, size });
        refreshUserCart();
        setMessage('Sepete eklendi!');
      }
    } catch (e) {
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
