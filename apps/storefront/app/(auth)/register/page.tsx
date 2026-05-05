'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z
  .object({
    firstName: z.string().min(1, 'Ad gerekli').max(100),
    lastName: z.string().min(1, 'Soyad gerekli').max(100),
    email: z.string().email('Geçerli bir e-posta girin'),
    phone: z.string().min(10, 'Geçerli bir telefon numarası girin').max(30),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gerekli'),
    kvkkConsent: z.literal(true, { errorMap: () => ({ message: 'KVKK onayı zorunludur' }) }),
    marketingConsent: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kvkkConsent: undefined as unknown as true, marketingConsent: false },
  });

  const onSubmit = async (data: FormValues) => {
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          kvkkConsent: data.kvkkConsent,
          marketingConsent: data.marketingConsent,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(res.status === 409 ? 'Bu e-posta adresi zaten kullanılıyor.' : (body?.message ?? 'Kayıt başarısız oldu.'));
        return;
      }
      window.location.href = '/';
    } catch {
      setError('Beklenmedik bir hata oluştu.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Kayıt Ol</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">Ad</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Soyad</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" type="tel" placeholder="05XX XXX XX XX" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <input
                  id="kvkkConsent"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-primary cursor-pointer shrink-0"
                  {...register('kvkkConsent')}
                />
                <label htmlFor="kvkkConsent" className="text-sm leading-snug cursor-pointer">
                  Kişisel verilerimin,{' '}
                  <span className="font-medium">6698 sayılı KVKK</span> kapsamında{' '}
                  <a href="#" className="text-primary hover:underline">Aydınlatma Metni</a>
                  &apos;nde belirtilen amaçlarla işlenmesine ve saklanmasına onay veriyorum.
                </label>
              </div>
              {errors.kvkkConsent && <p className="text-xs text-destructive">{errors.kvkkConsent.message}</p>}

              <div className="flex items-start gap-3">
                <input
                  id="marketingConsent"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-primary cursor-pointer shrink-0"
                  {...register('marketingConsent')}
                />
                <label htmlFor="marketingConsent" className="text-sm leading-snug cursor-pointer">
                  Kampanya, indirim ve bilgilendirmeler amacıyla SMS, e-posta ve arama yoluyla tarafıma{' '}
                  <a href="#" className="text-primary hover:underline">ticari elektronik ileti gönderilmesine</a>{' '}
                  onay veriyorum.
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Zaten hesabın var mı?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Giriş Yap
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
