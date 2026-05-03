'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  marketingConsent: z.boolean(),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gerekli'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  const {
    register: regPassword,
    handleSubmit: submitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: savingPassword },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    api.auth
      .me()
      .then((user) => {
        resetProfile({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phone: user.phone ?? '',
          marketingConsent: user.marketingConsent ?? false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resetProfile]);

  const onSaveProfile = async (data: ProfileValues) => {
    setProfileError('');
    setProfileSaved(false);
    try {
      await api.auth.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        marketingConsent: data.marketingConsent,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : 'Bir hata oluştu.');
    }
  };

  const onSavePhone = async (data: ProfileValues) => {
    setProfileError('');
    setPhoneSaved(false);
    try {
      await api.auth.updateProfile({
        phone: data.phone,
        marketingConsent: data.marketingConsent,
      });
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : 'Bir hata oluştu.');
    }
  };

  const onSavePassword = async (_data: PasswordValues) => {
    resetPassword();
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kullanıcı Bilgilerim</h1>

      <div className="flex gap-6 flex-wrap">
        {/* Üyelik Bilgileri */}
        <div className="flex-1 min-w-72 rounded-xl border p-6">
          <h2 className="mb-5 text-base font-semibold text-primary">Üyelik Bilgilerim</h2>

          <form onSubmit={submitProfile(onSaveProfile)} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Input placeholder="Ad" {...regProfile('firstName')} />
                {profileErrors.firstName && (
                  <p className="text-xs text-destructive">{profileErrors.firstName.message}</p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Input placeholder="Soyad" {...regProfile('lastName')} />
                {profileErrors.lastName && (
                  <p className="text-xs text-destructive">{profileErrors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Phone — inline button like the screenshot */}
            <div className="flex gap-2">
              <Input placeholder="Telefon" {...regProfile('phone')} className="flex-1" />
              <Button
                type="button"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={submitProfile(onSavePhone)}
                disabled={savingProfile}
              >
                Güncelle
              </Button>
            </div>

            {/* Date of birth row (UI only — not persisted yet) */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground appearance-none">
                  <option value="">Gün</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground appearance-none">
                  <option value="">Ay</option>
                  {['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground appearance-none">
                  <option value="">Yıl</option>
                  {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground appearance-none">
                <option value="">Cinsiyet</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            {profileSaved && <p className="text-sm text-green-600">Bilgileriniz güncellendi.</p>}

            <Button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Güncelle
            </Button>
          </form>
        </div>

        {/* Şifre Güncelleme */}
        <div className="flex-1 min-w-72 rounded-xl border p-6">
          <h2 className="mb-5 text-base font-semibold text-primary">Şifre Güncelleme</h2>

          <form onSubmit={submitPassword(onSavePassword)} className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Yeni Şifre"
                  {...regPassword('newPassword')}
                />
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Yeni Şifre (Tekrar)"
                {...regPassword('confirmPassword')}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Güncelle
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
