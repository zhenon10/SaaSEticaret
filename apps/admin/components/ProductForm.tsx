'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import type { Product } from '@saas/api-client';

const schema = z.object({
  name: z.string().min(2, 'İsim zorunlu'),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive('Fiyat pozitif olmalı'),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  initialQuantity: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  categories: { id: string; name: string }[];
  product?: Product;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const isEditing = !!product;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          sku: product.sku,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }
      : { isActive: true, isFeatured: false },
  });

  const onSubmit = async (data: FormValues) => {
    setError('');
    try {
      if (isEditing) {
        await api.catalog.updateProduct(product.id, data);
      } else {
        await api.catalog.createProduct(data);
      }
      router.push('/products');
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Kayıt başarısız oldu.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ürün Adı *" error={errors.name?.message}>
          <input className={inputClass} {...register('name')} />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <input className={inputClass} placeholder="otomatik-oluşturulur" {...register('slug')} />
        </Field>
      </div>

      <Field label="Açıklama" error={errors.description?.message}>
        <textarea
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          {...register('description')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Fiyat (TRY) *" error={errors.price?.message}>
          <input type="number" step="0.01" className={inputClass} {...register('price')} />
        </Field>
        <Field label="İndirimli Fiyat" error={errors.compareAtPrice?.message}>
          <input type="number" step="0.01" className={inputClass} {...register('compareAtPrice')} />
        </Field>
        <Field label="SKU" error={errors.sku?.message}>
          <input className={inputClass} {...register('sku')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori">
          <select className={inputClass} {...register('categoryId')}>
            <option value="">Kategori seçin</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        {!isEditing && (
          <Field label="Başlangıç Stoku" error={errors.initialQuantity?.message}>
            <input type="number" className={inputClass} placeholder="0" {...register('initialQuantity')} />
          </Field>
        )}
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" {...register('isActive')} />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" {...register('isFeatured')} />
          Öne Çıkar
        </label>
      </div>

      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-6 py-2 text-sm hover:bg-muted"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
