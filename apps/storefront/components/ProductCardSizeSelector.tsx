'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';

interface Props {
  productId: string;
  sizes: string[];
}

export default function ProductCardSizeSelector({ productId, sizes }: Props) {
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] ?? '');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedSize) {
      setMessage('Lütfen beden seçin');
      setMessageType('error');
      return;
    }

    setIsAddingToCart(true);
    setMessage('');

    try {
      await api.cart.addItem({ productId, quantity: 1, size: selectedSize });
      setMessage('Sepete eklendi!');
      setMessageType('success');
      setSelectedSize('');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login';
        return;
      }
      setMessage(e instanceof ApiError ? e.message : 'Hata oluştu.');
      setMessageType('error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="border-t border-gray-100 p-3 space-y-2">
      <div className="text-xs font-medium text-gray-700 mb-1">Beden Seçin:</div>
      <div className="flex flex-wrap gap-1">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setSelectedSize(size);
              setMessage('');
            }}
            className={`flex-1 min-w-[40px] rounded border px-2 py-1 text-xs transition ${
              selectedSize === size
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart}
        className={`w-full mt-2 rounded px-3 py-1.5 text-xs font-medium transition flex items-center justify-center gap-1 ${
          isAddingToCart
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-primary text-white hover:brightness-110'
        }`}
      >
        <ShoppingCart className="h-3 w-3" />
        {isAddingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
      </button>

      {message && (
        <p className={`text-xs text-center ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
