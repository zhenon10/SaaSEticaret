'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface FavoriteItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  price: number;
  compareAtPrice?: number;
}

interface FavoritesContextValue {
  items: FavoriteItem[];
  count: number;
  isFavorite: (productId: string) => boolean;
  toggle: (item: FavoriteItem) => void;
  remove: (productId: string) => void;
}

const STORAGE_KEY = 'favorites_v1';

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

export default function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = useCallback((item: FavoriteItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.productId === item.productId);
      const next = exists
        ? prev.filter((i) => i.productId !== item.productId)
        : [...prev, item];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  );

  return (
    <FavoritesContext.Provider value={{ items, count: items.length, isFavorite, toggle, remove }}>
      {children}
    </FavoritesContext.Provider>
  );
}
