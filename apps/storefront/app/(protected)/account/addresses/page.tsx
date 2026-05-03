'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import type { UserAddress } from '@saas/api-client';
import { ApiError } from '@saas/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Star, MapPin } from 'lucide-react';

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  label:      z.string().min(1, 'Adres başlığı gerekli').max(100),
  fullName:   z.string().min(1, 'Ad soyad gerekli').max(200),
  phone:      z.string().min(10, 'Geçerli telefon girin').max(30),
  line1:      z.string().min(1, 'Adres satırı gerekli').max(300),
  line2:      z.string().max(300).optional(),
  district:   z.string().min(1, 'İlçe gerekli').max(100),
  city:       z.string().min(1, 'Şehir gerekli').max(100),
  postalCode: z.string().max(20).optional(),
  country:    z.string().max(100).default('Türkiye'),
  isDefault:  z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState<UserAddress | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'Türkiye', isDefault: false },
  });

  const load = async () => {
    try {
      setAddresses(await api.addresses.getAll());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ country: 'Türkiye', isDefault: false, label: '', fullName: '', phone: '', line1: '', line2: '', district: '', city: '', postalCode: '' });
    setFormError('');
    setOpen(true);
  };

  const openEdit = (addr: UserAddress) => {
    setEditing(addr);
    reset({
      label: addr.label, fullName: addr.fullName, phone: addr.phone,
      line1: addr.line1, line2: addr.line2 ?? '', district: addr.district,
      city: addr.city, postalCode: addr.postalCode ?? '', country: addr.country,
      isDefault: addr.isDefault,
    });
    setFormError('');
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    setFormError('');
    try {
      const payload = {
        label: data.label, fullName: data.fullName, phone: data.phone,
        line1: data.line1, line2: data.line2 || undefined, district: data.district,
        city: data.city, postalCode: data.postalCode || '', country: data.country,
        isDefault: data.isDefault,
      };
      if (editing) {
        await api.addresses.update(editing.id, payload);
      } else {
        await api.addresses.create(payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Bir hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.addresses.remove(id);
      setDeleteId(null);
      await load();
    } catch { /* ignore */ }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.addresses.setDefault(id);
      await load();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Adres Bilgilerim</h1>
        <Button onClick={openNew} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4" />
          Yeni Adres Ekle
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">Yükleniyor...</div>
      ) : addresses.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-muted-foreground">
          <MapPin className="h-8 w-8 opacity-40" />
          <p className="text-sm">Henüz kayıtlı adresiniz yok.</p>
          <Button variant="outline" size="sm" onClick={openNew}>Adres Ekle</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-xl border p-5 transition-colors ${addr.isDefault ? 'border-primary bg-primary/5' : ''}`}
            >
              {addr.isDefault && (
                <span className="absolute right-4 top-4 flex items-center gap-1 text-xs font-medium text-primary">
                  <Star className="h-3 w-3 fill-primary" /> Varsayılan
                </span>
              )}
              <p className="mb-1 font-semibold">{addr.label}</p>
              <p className="text-sm text-muted-foreground">{addr.fullName}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
              <p className="mt-1 text-sm">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                {addr.district} / {addr.city}{addr.postalCode ? ` ${addr.postalCode}` : ''}<br />
                {addr.country}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  className="flex items-center gap-1.5 text-xs"
                  onClick={() => openEdit(addr)}
                >
                  <Pencil className="h-3 w-3" /> Düzenle
                </Button>
                {!addr.isDefault && (
                  <Button
                    variant="outline" size="sm"
                    className="flex items-center gap-1.5 text-xs text-primary border-primary hover:bg-primary/10"
                    onClick={() => handleSetDefault(addr.id)}
                  >
                    <Star className="h-3 w-3" /> Varsayılan Yap
                  </Button>
                )}
                <Button
                  variant="outline" size="sm"
                  className="ml-auto flex items-center gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setDeleteId(addr.id)}
                >
                  <Trash2 className="h-3 w-3" /> Sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{editing ? 'Adresi Düzenle' : 'Yeni Adres'}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-6 py-5">
              <Field label="Adres Başlığı" error={errors.label?.message}>
                <Input placeholder="Ev, İş, Yazlık..." {...register('label')} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Ad Soyad" error={errors.fullName?.message}>
                  <Input placeholder="Ad Soyad" {...register('fullName')} />
                </Field>
                <Field label="Telefon" error={errors.phone?.message}>
                  <Input placeholder="05XX XXX XX XX" {...register('phone')} />
                </Field>
              </div>

              <Field label="Adres" error={errors.line1?.message}>
                <Input placeholder="Sokak, Mahalle, Apartman No..." {...register('line1')} />
              </Field>

              <Field label="Adres Devamı (isteğe bağlı)" error={errors.line2?.message}>
                <Input placeholder="Daire, Kat..." {...register('line2')} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="İlçe" error={errors.district?.message}>
                  <Input placeholder="İlçe" {...register('district')} />
                </Field>
                <Field label="Şehir" error={errors.city?.message}>
                  <Input placeholder="Şehir" {...register('city')} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Posta Kodu" error={errors.postalCode?.message}>
                  <Input placeholder="34000" {...register('postalCode')} />
                </Field>
                <Field label="Ülke" error={errors.country?.message}>
                  <Input {...register('country')} />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-primary" {...register('isDefault')} />
                Varsayılan adresim olarak ayarla
              </label>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl text-center">
            <p className="mb-4 font-medium">Bu adresi silmek istediğinize emin misiniz?</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}>İptal</Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteId)}
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
