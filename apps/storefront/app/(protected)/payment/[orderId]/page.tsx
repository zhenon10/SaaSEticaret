'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';

export default function PaymentPage() {
  const params  = useParams();
  const orderId = params.orderId as string;
  const [error, setError] = useState('');

  useEffect(() => {
    async function initiate() {
      try {
        const result = await api.payments.initiate(orderId);
        window.location.href = result.paymentPageUrl;
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          setError('Ödeme başlatılamadı. Lütfen tekrar deneyin.');
        }
      }
    }
    initiate();
  }, [orderId]);

  if (error) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
          <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold">Ödeme Başlatılamadı</h1>
        <p className="mb-8 text-sm text-muted-foreground">{error}</p>
        <Link
          href={`/account/orders/${orderId}`}
          className="inline-block rounded-lg border px-5 py-2.5 text-sm hover:bg-muted transition-colors"
        >
          ← Siparişe Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      <p className="text-muted-foreground">Ödeme sayfasına yönlendiriliyorsunuz...</p>
    </div>
  );
}
