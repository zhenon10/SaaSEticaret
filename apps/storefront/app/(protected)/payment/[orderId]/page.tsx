'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ApiError, type BankTransferResponse } from '@saas/api-client';
import { CreditCard, Building2, Copy, Check } from 'lucide-react';

type Step = 'select' | 'loading' | 'bank_details' | 'error';

export default function PaymentPage() {
  const params   = useParams();
  const router   = useRouter();
  const orderId  = params.orderId as string;

  const [step, setStep]         = useState<Step>('select');
  const [error, setError]       = useState('');
  const [bankInfo, setBankInfo] = useState<BankTransferResponse | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleIyzico = async () => {
    setStep('loading');
    try {
      const result = await api.payments.initiate(orderId);
      window.location.href = result.paymentPageUrl;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ödeme başlatılamadı. Lütfen tekrar deneyin.');
      setStep('error');
    }
  };

  const handleBankTransfer = async () => {
    setStep('loading');
    try {
      const info = await api.payments.bankTransfer(orderId);
      setBankInfo(info);
      setStep('bank_details');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Bilgiler alınamadı. Lütfen tekrar deneyin.');
      setStep('error');
    }
  };

  if (step === 'loading') {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">İşleminiz hazırlanıyor...</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
          <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold">Bir Hata Oluştu</h1>
        <p className="mb-8 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => setStep('select')}
          className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (step === 'bank_details' && bankInfo) {
    const rows = [
      { label: 'Banka',         value: bankInfo.bankName,       key: 'bank' },
      ...(bankInfo.branch ? [{ label: 'Şube', value: bankInfo.branch, key: 'branch' }] : []),
      { label: 'Hesap Sahibi', value: bankInfo.accountHolder,  key: 'holder' },
      { label: 'IBAN',          value: bankInfo.iban,           key: 'iban' },
      { label: 'Tutar',         value: `${bankInfo.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${bankInfo.currency}`, key: 'amount' },
      { label: 'Açıklama',      value: bankInfo.orderNumber,    key: 'desc' },
    ];

    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-blue-100">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold">Havale / EFT Bilgileri</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Aşağıdaki banka hesabına ödeme yapınız. Açıklama kısmına <strong>{bankInfo.orderNumber}</strong> yazınız.
        </p>

        <div className="rounded-xl border divide-y overflow-hidden">
          {rows.map(({ label, value, key }) => (
            <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="min-w-24 text-sm font-medium text-muted-foreground">{label}</span>
              <span className="flex-1 text-sm font-mono break-all">{value}</span>
              <button
                onClick={() => copyToClipboard(value, key)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                title="Kopyala"
              >
                {copied === key
                  ? <Check className="h-4 w-4 text-green-600" />
                  : <Copy className="h-4 w-4" />
                }
              </button>
            </div>
          ))}
        </div>

        {bankInfo.description && (
          <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            {bankInfo.description}
          </p>
        )}

        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          Ödemeniz tarafımıza ulaştıktan sonra siparişiniz onaylanacak ve hazırlanmaya başlanacaktır.
        </div>

        <div className="mt-6 flex flex-col gap-3 items-center">
          <Link
            href={`/payment/result?orderId=${orderId}&method=bank`}
            className="w-full rounded-lg bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ödemeyi Yaptım →
          </Link>
          <Link href={`/account/orders/${orderId}`} className="text-sm text-muted-foreground hover:text-foreground">
            Siparişe Dön
          </Link>
        </div>
      </div>
    );
  }

  // Step: select
  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-2 text-center text-2xl font-bold">Ödeme Yöntemi</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Nasıl ödeme yapmak istediğinizi seçin.
      </p>

      <div className="space-y-3">
        {/* İyzico */}
        <button
          onClick={handleIyzico}
          className="group w-full flex items-center gap-4 rounded-xl border-2 border-transparent bg-white p-5 shadow-sm transition-all hover:border-primary hover:shadow-md text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-primary group-hover:text-white transition-colors">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Kredi / Banka Kartı</p>
            <p className="text-sm text-muted-foreground">İyzico güvencesiyle güvenli ödeme. Taksit seçeneği mevcut.</p>
          </div>
        </button>

        {/* Havale / EFT */}
        <button
          onClick={handleBankTransfer}
          className="group w-full flex items-center gap-4 rounded-xl border-2 border-transparent bg-white p-5 shadow-sm transition-all hover:border-primary hover:shadow-md text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 group-hover:bg-primary group-hover:text-white transition-colors">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Havale / EFT</p>
            <p className="text-sm text-muted-foreground">Banka havalesi ile ödeme yapın. Ödeme doğrulandıktan sonra siparişiniz onaylanır.</p>
          </div>
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link href={`/account/orders/${orderId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Siparişe Dön
        </Link>
      </div>
    </div>
  );
}
