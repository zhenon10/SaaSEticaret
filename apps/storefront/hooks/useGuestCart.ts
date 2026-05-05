'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuestCartItem } from '@saas/api-client';

const STORAGE_KEY = 'guest_cart';

function load(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(items: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>([]);

  useEffect(() => {
    setItems(load());
  }, []);

  const addItem = useCallback((item: Omit<GuestCartItem, 'localId'>) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.color === item.color && i.size === item.size,
      );
      let next: GuestCartItem[];
      if (existing) {
        next = prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      } else {
        next = [...prev, { ...item, localId: crypto.randomUUID() }];
      }
      save(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((localId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.localId !== localId);
      save(next);
      return next;
    });
  }, []);

  const updateItem = useCallback((localId: string, quantity: number) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.localId === localId ? { ...i, quantity } : i));
      save(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, addItem, removeItem, updateItem, clearCart, subtotal, itemCount };
}
