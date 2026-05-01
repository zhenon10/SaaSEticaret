'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';

const schema = z.object({
  name: z.string().min(2, 'İsim zorunlu'),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;
const inputClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export default function NewCategoryPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayOrder: 0 },
  });

  const toSlug = (text: string) =>
    text.toLowerCase().trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const onSubmit = async (data: FormValues) => {
    setError('');
    try {
      await api.catalog.createCategory({
        ...data,
        slug: data.slug || toSlug(data.name),
      });
      router.push('/categories');
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Kayıt başarısız oldu.');
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-bold">Yeni Kategori</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border p-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">İsim *</label>
          <input className={inputClass} {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <input className={inputClass} placeholder="otomatik-oluşturulur" {...register('slug')} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Açıklama</label>
          <textarea rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" {...register('description')} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sıralama</label>
          <input type="number" className={inputClass} {...register('displayOrder')} />
        </div>

        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting ? 'Kaydediliyor...' : 'Oluştur'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-md border px-6 py-2 text-sm hover:bg-muted">
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}
