'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResultContent() {
  const searchParams = useSearchParams();
  const orderId  = searchParams.get('orderId');
  const success  = searchParams.get('success') === 'true';
  const method   = searchParams.get('method'); // 'bank' for bank transfer
  const errorMsg = searchParams.get('error');

  // Bank transfer — waiting for payment
  if (method === 'bank') {
    return (
      <>
        <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-blue-100">
          <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold">Ödeme Bekleniyor</h1>
        <p className="mb-2 text-muted-foreground">Siparişiniz alındı.</p>
        <p className="mb-8 text-sm text-muted-foreground max-w-sm mx-auto">
          Havale/EFT ödemesi tarafımıza ulaştıktan sonra siparişiniz onaylanacak ve
          hazırlanmaya başlanacaktır. Bu işlem birkaç iş saati sürebilir.
        </p>
        {orderId && (
          <div className="flex flex-col gap-3 items-center">
            <Link
              href={`/account/orders/${orderId}`}
              className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Siparişimi Görüntüle →
            </Link>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
              Alışverişe Devam Et
            </Link>
          </div>
        )}
      </>
    );
  }

  if (success) {
    return (
      <>
        <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold">Ödeme Başarılı!</h1>
        <p className="mb-8 text-muted-foreground">Siparişiniz onaylandı. Teşekkür ederiz.</p>
        {orderId && (
          <div className="flex flex-col gap-3 items-center">
            <Link
              href={`/account/orders/${orderId}`}
              className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Siparişimi Görüntüle →
            </Link>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
              Alışverişe Devam Et
            </Link>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-destructive/10">
        <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold">Ödeme Başarısız</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {errorMsg ? decodeURIComponent(errorMsg) : 'Ödeme işlemi gerçekleştirilemedi.'}
      </p>
      {orderId && (
        <div className="flex flex-col gap-3 items-center">
          <Link
            href={`/payment/${orderId}`}
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Tekrar Dene
          </Link>
          <Link href={`/account/orders/${orderId}`} className="text-sm text-muted-foreground hover:text-foreground">
            Siparişi Görüntüle
          </Link>
        </div>
      )}
    </>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <Suspense fallback={<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />}>
        <ResultContent />
      </Suspense>
    </div>
  );
}
