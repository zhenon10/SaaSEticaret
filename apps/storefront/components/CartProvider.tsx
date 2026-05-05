'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { GuestCartItem } from '@saas/api-client';
import { api } from '@/lib/api';
import { useGuestCart } from '@/hooks/useGuestCart';

interface CartContextValue {
  isGuest: boolean;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  guestItems: GuestCartItem[];
  addGuestItem: (item: Omit<GuestCartItem, 'localId'>) => void;
  removeGuestItem: (localId: string) => void;
  updateGuestItem: (localId: string, quantity: number) => void;
  clearGuestCart: () => void;
  refreshUserCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userItemCount, setUserItemCount] = useState(0);
  const [userSubtotal, setUserSubtotal] = useState(0);
  const initialized = useRef(false);

  const guestCart = useGuestCart();

  const fetchUserCart = useCallback(async () => {
    try {
      const cart = await api.cart.getCart();
      setUserItemCount(cart.itemCount);
      setUserSubtotal(cart.subtotal);
      setIsGuest(false);
    } catch {
      setIsGuest(true);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setIsLoading(true);
    fetchUserCart().finally(() => setIsLoading(false));
  }, [fetchUserCart]);

  const itemCount = isGuest ? guestCart.itemCount : userItemCount;
  const subtotal  = isGuest ? guestCart.subtotal  : userSubtotal;

  return (
    <CartContext.Provider value={{
      isGuest,
      isLoading,
      itemCount,
      subtotal,
      guestItems:      guestCart.items,
      addGuestItem:    guestCart.addItem,
      removeGuestItem: guestCart.removeItem,
      updateGuestItem: guestCart.updateItem,
      clearGuestCart:  guestCart.clearCart,
      refreshUserCart: fetchUserCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}
