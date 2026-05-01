'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Ad Soyad zorunlu'),
  email: z.string().email('Geçerli e-posta girin'),
  phone: z.string().min(10, 'Geçerli telefon girin'),
  line1: z.string().min(5, 'Adres zorunlu'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Şehir zorunlu'),
  state: z.string().min(2, 'İlçe zorunlu'),
  postalCode: z.string().min(5, 'Posta kodu zorunlu'),
  country: z.string().min(2, 'Ülke zorunlu').default('TR'),
});

type FormValues = z.infer<typeof addressSchema>;

function Field({ label, id, error, ...props }: { label: string; id: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'TR' },
  });

  const onSubmit = async (data: FormValues) => {
    setError('');
    try {
      const order = await api.orders.checkout({
        shippingAddress: data,
        currency: 'TRY',
      });
      router.push(`/account/orders/${order.id}`);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Sipariş oluşturulurken hata oluştu.');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Sipariş Bilgileri</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-lg font-semibold">Teslimat Adresi</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad Soyad" id="fullName" error={errors.fullName?.message} {...register('fullName')} />
          <Field label="E-posta" id="email" type="email" error={errors.email?.message} {...register('email')} />
          <Field label="Telefon" id="phone" type="tel" error={errors.phone?.message} {...register('phone')} />
          <Field label="Posta Kodu" id="postalCode" error={errors.postalCode?.message} {...register('postalCode')} />
        </div>

        <Field label="Adres" id="line1" error={errors.line1?.message} {...register('line1')} />
        <Field label="Daire / Kat (isteğe bağlı)" id="line2" {...register('line2')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Şehir" id="city" error={errors.city?.message} {...register('city')} />
          <Field label="İlçe" id="state" error={errors.state?.message} {...register('state')} />
          <Field label="Ülke" id="country" error={errors.country?.message} {...register('country')} />
        </div>

        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Sipariş oluşturuluyor...' : 'Siparişi Onayla'}
        </Button>
      </form>
    </div>
  );
}
