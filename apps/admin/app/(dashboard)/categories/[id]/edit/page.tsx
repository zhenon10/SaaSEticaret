'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import type { Category } from '@saas/api-client';

const schema = z.object({
  name: z.string().min(2, 'İsim zorunlu'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;
const inputClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

function flattenCategories(cats: Category[], excludeId: string, prefix = ''): { id: string; label: string }[] {
  return cats.flatMap((c) => {
    if (c.id === excludeId) return [];
    return [
      { id: c.id, label: prefix + c.name },
      ...flattenCategories(c.children ?? [], excludeId, prefix + c.name + ' › '),
    ];
  });
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    Promise.all([
      api.catalog.getCategoryById(id),
      api.catalog.getCategoryTree(),
    ]).then(([cat, tree]) => {
      reset({
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? '',
        parentId: cat.parentId ?? '',
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      });
      setCategories(flattenCategories(tree, id));
    }).catch(() => {
      setError('Kategori yüklenemedi.');
    }).finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    setError('');
    try {
      await api.catalog.updateCategory(id, {
        name: data.name,
        slug: data.slug || undefined,
        description: data.description,
        parentId: data.parentId || undefined,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      });
      router.push('/categories');
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Güncelleme başarısız oldu.');
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-bold">Kategori Düzenle</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border p-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">İsim *</label>
          <input className={inputClass} {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <input className={inputClass} {...register('slug')} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Üst Kategori</label>
          <select className={inputClass} {...register('parentId')}>
            <option value="">— Üst kategori yok (kök kategori) —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Açıklama</label>
          <textarea rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" {...register('description')} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sıralama</label>
          <input type="number" className={inputClass} {...register('displayOrder')} />
        </div>
        <div>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-4 w-4 rounded" {...register('isActive')} />
            <span className="text-sm font-medium">Aktif</span>
          </label>
        </div>

        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting ? 'Kaydediliyor...' : 'Güncelle'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-md border px-6 py-2 text-sm hover:bg-muted">
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}
