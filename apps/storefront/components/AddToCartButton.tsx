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
  quantity?: number;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  onBeforeAdd?: () => boolean;
}

export default function AddToCartButton({
  productId,
  productName,
  productSlug,
  unitPrice,
  productImage,
  sku,
  color,
  size,
  quantity = 1,
  disabled = false,
  compact = false,
  className,
  onBeforeAdd,
}: Props) {
  const { isGuest, addGuestItem, refreshUserCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    if (onBeforeAdd && !onBeforeAdd()) return;
    setLoading(true);
    setMessage('');
    try {
      if (isGuest) {
        addGuestItem({
          productId,
          productName,
          productSlug,
          unitPrice,
          productImage,
          sku,
          color,
          size,
          quantity,
        });
        setMessage('Sepete eklendi!');
      } else {
        await api.cart.addItem({ productId, quantity, color, size });
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
    <div className={compact ? 'space-y-0' : 'space-y-2'}>
      <Button
        onClick={handleAdd}
        disabled={loading || disabled}
        size={compact ? 'default' : 'lg'}
        className={className ?? 'w-full gap-2'}
      >
        <ShoppingCart className="h-4 w-4" />
        {loading ? 'Ekleniyor...' : compact ? 'Sepete Ekle' : 'Sepete Ekle'}
      </Button>
      {!compact && message && (
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
