'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, ShieldCheck, User, UserX, Truck } from 'lucide-react';
import { useShipping } from '@/hooks/useShipping';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import type { Cart } from '@saas/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/components/CartProvider';
import { formatPrice } from '@/lib/utils';

// ── Schemas ───────────────────────────────────────────────────────────────────

const guestSchema = z.object({
  email:          z.string().email('Geçerli e-posta girin'),
  phone:          z.string().min(10, 'Geçerli telefon girin'),
  fullName:       z.string().min(2, 'Ad Soyad zorunlu'),
  line1:          z.string().min(5, 'Adres zorunlu'),
  line2:          z.string().optional(),
  city:           z.string().min(2, 'Şehir zorunlu'),
  state:          z.string().min(2, 'İlçe zorunlu'),
  postalCode:     z.string().min(5, 'Posta kodu zorunlu'),
  country:        z.string().default('TR'),
  identityNumber: z.string().regex(/^[1-9]\d{10}$/, 'TC Kimlik No 11 haneli olmalı'),
});

const userSchema = z.object({
  fullName:   z.string().min(2, 'Ad Soyad zorunlu'),
  email:      z.string().email('Geçerli e-posta girin'),
  phone:      z.string().min(10, 'Geçerli telefon girin'),
  line1:      z.string().min(5, 'Adres zorunlu'),
  line2:      z.string().optional(),
  city:       z.string().min(2, 'Şehir zorunlu'),
  state:      z.string().min(2, 'İlçe zorunlu'),
  postalCode: z.string().min(5, 'Posta kodu zorunlu'),
  country:    z.string().default('TR'),
});

type GuestForm = z.infer<typeof guestSchema>;
type UserForm  = z.infer<typeof userSchema>;

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label, id, error, ...props
}: { label: string; id: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
      <Input
        id={id}
        className="h-11 rounded-lg border-gray-200 bg-gray-50 px-4 focus:bg-white focus:border-primary"
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Guest choice screen ───────────────────────────────────────────────────────

function GuestChoiceScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Siparişi Tamamla</h1>
          <p className="mt-1 text-sm text-muted-foreground">Devam etmek için bir seçenek belirleyin</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/login?from=/checkout"
            className="flex w-full items-center justify-between rounded-xl border-2 border-primary bg-primary/5 px-5 py-4 text-left transition hover:bg-primary/10"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-gray-900">Giriş Yap</p>
                <p className="text-xs text-muted-foreground">Hesabınıza girin, siparişlerinizi takip edin</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-primary" />
          </Link>

          <Link
            href="/register?from=/checkout"
            className="flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-900">Üye Ol</p>
                <p className="text-xs text-muted-foreground">Hızlı kayıt, siparişlerinizi yönetin</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs text-muted-foreground">veya</span>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="flex w-full items-center justify-between rounded-xl border border-dashed px-5 py-4 text-left transition hover:bg-muted/30"
        >
          <div className="flex items-center gap-3">
            <UserX className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">Üye Olmadan Devam Et</p>
              <p className="text-xs text-muted-foreground">Sadece bu sipariş için bilgilerinizi girin</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ── Order summary (right column) ──────────────────────────────────────────────

function GuestOrderSummary() {
  const { guestItems, subtotal } = useCart();
  return <OrderSummaryBox items={guestItems.map(i => ({
    image: i.productImage, name: i.productName, variant: [i.color, i.size].filter(Boolean).join(' / '),
    quantity: i.quantity, total: i.unitPrice * i.quantity,
  }))} subtotal={subtotal} />;
}

function UserOrderSummary() {
  const [cart, setCart] = useState<Cart | null>(null);
  useEffect(() => { api.cart.getCart().then(setCart).catch(() => {}); }, []);
  if (!cart) return null;
  return <OrderSummaryBox items={cart.items.map(i => ({
    image: i.productImage, name: i.productName, variant: [i.color, i.size].filter(Boolean).join(' / '),
    quantity: i.quantity, total: i.lineTotal,
  }))} subtotal={cart.subtotal} />;
}

function OrderSummaryBox({ items, subtotal }: {
  items: { image?: string; name: string; variant: string; quantity: number; total: number }[];
  subtotal: number;
}) {
  const { shippingCost, isFree, remaining, freeThreshold } = useShipping(subtotal);

  return (
    <div className="rounded-2xl border bg-gray-50 p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Sipariş Özeti</h2>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-white">
              {item.image
                ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                : <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">Görsel</div>
              }
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-[10px] font-bold text-white">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
            </div>
            <span className="text-sm font-semibold">{formatPrice(item.total)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Ara Toplam</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kargo</span>
          {isFree
            ? <span className="text-green-600 font-medium">Ücretsiz</span>
            : <span className="font-medium">{formatPrice(shippingCost)}</span>
          }
        </div>
        {!isFree && freeThreshold > 0 && remaining > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Truck className="h-3.5 w-3.5 shrink-0" />
            <span><strong>{formatPrice(remaining)}</strong> daha ekleyin, kargo ücretsiz!</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base border-t pt-2">
          <span>Toplam</span>
          <span>{formatPrice(subtotal + shippingCost)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-white border px-3 py-2">
        <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
        <p className="text-xs text-muted-foreground">Tüm işlemler güvenli ve şifrelidir.</p>
      </div>
    </div>
  );
}

// ── Guest form ─────────────────────────────────────────────────────────────────

function GuestCheckoutForm() {
  const router = useRouter();
  const { guestItems, clearGuestCart } = useCart();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: { country: 'TR' },
  });

  const onSubmit = async (data: GuestForm) => {
    setError('');
    if (guestItems.length === 0) { setError('Sepetiniz boş.'); return; }
    try {
      localStorage.setItem('guest_identity', data.identityNumber);
      const order = await api.orders.guestCheckout({
        shippingAddress: {
          fullName: data.fullName, email: data.email, phone: data.phone,
          line1: data.line1, line2: data.line2, city: data.city,
          state: data.state, postalCode: data.postalCode, country: data.country,
        },
        items: guestItems.map((i) => ({ productId: i.productId, quantity: i.quantity, color: i.color, size: i.size })),
        currency: 'TRY',
      });
      clearGuestCart();
      router.push(`/payment/${order.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Sipariş oluşturulurken hata oluştu.');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-6">

        {/* İletişim */}
        <section className="rounded-2xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">İletişim</h2>
          <Field label="E-posta" id="email" type="email" placeholder="ornek@email.com" error={errors.email?.message} {...register('email')} />
          <Field label="Telefon" id="phone" type="tel" placeholder="05XX XXX XX XX" error={errors.phone?.message} {...register('phone')} />
        </section>

        {/* Teslimat Adresi */}
        <section className="rounded-2xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Teslimat Adresi</h2>
          <Field label="Ad Soyad" id="fullName" placeholder="Ad Soyad" error={errors.fullName?.message} {...register('fullName')} />
          <Field label="Adres" id="line1" placeholder="Mahalle, sokak, bina no" error={errors.line1?.message} {...register('line1')} />
          <Field label="Daire / Kat (isteğe bağlı)" id="line2" placeholder="Daire no, kat, blok..." {...register('line2')} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="İlçe" id="state" placeholder="İlçe" error={errors.state?.message} {...register('state')} />
            <Field label="Şehir" id="city" placeholder="Şehir" error={errors.city?.message} {...register('city')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Posta Kodu" id="postalCode" placeholder="34XXX" error={errors.postalCode?.message} {...register('postalCode')} />
            <Field label="Ülke" id="country" error={errors.country?.message} {...register('country')} />
          </div>
        </section>

        {/* Fatura Bilgileri */}
        <section className="rounded-2xl border bg-white p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Fatura Bilgileri</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Yasal fatura düzenlenmesi için gereklidir.</p>
          </div>
          <Field
            label="TC Kimlik No"
            id="identityNumber"
            placeholder="XXXXXXXXXXX"
            maxLength={11}
            inputMode="numeric"
            error={errors.identityNumber?.message}
            {...register('identityNumber')}
          />
        </section>

        {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={isSubmitting}>
          {isSubmitting ? 'Sipariş oluşturuluyor...' : 'Ödemeye Geç →'}
        </Button>
      </form>

      <div className="lg:col-span-2">
        <GuestOrderSummary />
      </div>
    </div>
  );
}

// ── User form ─────────────────────────────────────────────────────────────────

function UserCheckoutForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { country: 'TR' },
  });

  const onSubmit = async (data: UserForm) => {
    setError('');
    try {
      const order = await api.orders.checkout({ shippingAddress: data, currency: 'TRY' });
      router.push(`/payment/${order.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Sipariş oluşturulurken hata oluştu.');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-6">

        <section className="rounded-2xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Teslimat Adresi</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ad Soyad" id="fullName" error={errors.fullName?.message} {...register('fullName')} />
            <Field label="E-posta"  id="email"    type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <Field label="Telefon" id="phone" type="tel" error={errors.phone?.message} {...register('phone')} />
          <Field label="Adres"   id="line1" error={errors.line1?.message} {...register('line1')} />
          <Field label="Daire / Kat (isteğe bağlı)" id="line2" {...register('line2')} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="İlçe"  id="state"      error={errors.state?.message}      {...register('state')} />
            <Field label="Şehir" id="city"        error={errors.city?.message}       {...register('city')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Posta Kodu" id="postalCode" error={errors.postalCode?.message} {...register('postalCode')} />
            <Field label="Ülke"       id="country"    error={errors.country?.message}    {...register('country')} />
          </div>
        </section>

        {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={isSubmitting}>
          {isSubmitting ? 'Sipariş oluşturuluyor...' : 'Ödemeye Geç →'}
        </Button>
      </form>

      <div className="lg:col-span-2">
        <UserOrderSummary />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { isGuest, isLoading } = useCart();
  const [guestConfirmed, setGuestConfirmed] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  // Guests see the choice screen first
  if (isGuest && !guestConfirmed) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <GuestChoiceScreen onContinue={() => setGuestConfirmed(true)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Siparişi Tamamla</h1>
        {isGuest && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            Misafir olarak devam ediyorsunuz
          </span>
        )}
      </div>

      {isGuest ? <GuestCheckoutForm /> : <UserCheckoutForm />}
    </div>
  );
}
