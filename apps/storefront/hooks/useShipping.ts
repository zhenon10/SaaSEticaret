'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ShippingInfo {
  fee: number;
  freeThreshold: number;
  isLoading: boolean;
}

let cache: { fee: number; freeThreshold: number } | null = null;

export function useShipping(subtotal: number) {
  const [info, setInfo] = useState<ShippingInfo>({ fee: 0, freeThreshold: 0, isLoading: true });

  useEffect(() => {
    if (cache) {
      setInfo({ ...cache, isLoading: false });
      return;
    }
    api.settings.getAll()
      .then((s) => {
        const fee           = parseFloat(s['shipping.fee'] ?? '0') || 0;
        const freeThreshold = parseFloat(s['shipping.free_threshold'] ?? '0') || 0;
        cache = { fee, freeThreshold };
        setInfo({ fee, freeThreshold, isLoading: false });
      })
      .catch(() => setInfo({ fee: 0, freeThreshold: 0, isLoading: false }));
  }, []);

  const shippingCost = info.freeThreshold > 0 && subtotal >= info.freeThreshold ? 0 : info.fee;
  const isFree       = shippingCost === 0;
  const remaining    = info.freeThreshold > 0 ? Math.max(0, info.freeThreshold - subtotal) : 0;

  return { shippingCost, isFree, remaining, freeThreshold: info.freeThreshold, isLoading: info.isLoading };
}
