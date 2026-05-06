'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import type { Product } from '@saas/api-client';
import { X, Plus } from 'lucide-react';

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
  initialStock: z.coerce.number().int().min(0).optional(),
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
  // For edit: images managed live via API. For create: collected and added after product creation.
  const [savedImages, setSavedImages] = useState<{ id: string; url: string; isPrimary: boolean }[]>(
    product?.images ?? []
  );
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [colorInput, setColorInput] = useState('');
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState('');

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

  const toSlug = (text: string) =>
    text.toLowerCase().trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleUpload = async (files: File[]) => {
    setImageLoading(true);
    setError('');
    try {
      const urls = await Promise.all(files.map((f) => api.uploadImage(f)));
      if (isEditing) {
        // Save immediately to API
        const results = await Promise.all(
          urls.map((url, i) =>
            api.catalog.addImage(product.id, {
              url,
              isPrimary: savedImages.length === 0 && i === 0,
            })
          )
        );
        setSavedImages((prev) => [
          ...prev,
          ...results.map((r) => ({ id: r.id, url: r.url, isPrimary: r.isPrimary })),
        ]);
      } else {
        setPendingUrls((prev) => [...prev, ...urls]);
      }
    } catch {
      setError('Görsel yüklenemedi.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!isEditing) return;
    try {
      await api.catalog.removeImage(product.id, id);
      setSavedImages((prev) => prev.filter((img) => img.id !== id));
    } catch (e) {
      const msg = e instanceof ApiError
        ? `Görsel silinemedi. (HTTP ${e.status}${e.message !== `HTTP ${e.status}` ? ': ' + e.message : ''})`
        : e instanceof Error ? `Görsel silinemedi. (${e.message})` : 'Görsel silinemedi.';
      setError(msg);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setError('');
    const payload = { ...data, slug: data.slug || toSlug(data.name), colors, sizes, categoryId: data.categoryId || undefined };
    try {
      if (isEditing) {
        await api.catalog.updateProduct(product.id, payload);
      } else {
        const created = await api.catalog.createProduct(payload);
        // Add pending images to newly created product
        await Promise.all(
          pendingUrls.map((url, i) =>
            api.catalog.addImage(created.id, { url, isPrimary: i === 0 })
          )
        );
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
          <Field label="Başlangıç Stoku" error={errors.initialStock?.message}>
            <input type="number" className={inputClass} placeholder="0" {...register('initialStock')} />
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Renkler">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColors((prev) => prev.filter((item) => item !== color))}
                  className="rounded-full border border-input px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
                >
                  {color}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={colorInput}
                onChange={(event) => setColorInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    const value = colorInput.trim();
                    if (value && !colors.includes(value)) {
                      setColors((prev) => [...prev, value]);
                    }
                    setColorInput('');
                  }
                }}
                className={inputClass}
                placeholder="Örn: Mavi"
              />
              <button
                type="button"
                onClick={() => {
                  const value = colorInput.trim();
                  if (value && !colors.includes(value)) {
                    setColors((prev) => [...prev, value]);
                  }
                  setColorInput('');
                }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ekle
              </button>
            </div>
          </div>
        </Field>

        <Field label="Bedenler">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSizes((prev) => prev.filter((item) => item !== size))}
                  className="rounded-full border border-input px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={sizeInput}
                onChange={(event) => setSizeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    const value = sizeInput.trim();
                    if (value && !sizes.includes(value)) {
                      setSizes((prev) => [...prev, value]);
                    }
                    setSizeInput('');
                  }
                }}
                className={inputClass}
                placeholder="Örn: S, M, L"
              />
              <button
                type="button"
                onClick={() => {
                  const value = sizeInput.trim();
                  if (value && !sizes.includes(value)) {
                    setSizes((prev) => [...prev, value]);
                  }
                  setSizeInput('');
                }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ekle
              </button>
            </div>
          </div>
        </Field>
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

      {/* Görseller */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Görseller</label>
        <div className="flex flex-wrap gap-3">
          {savedImages.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt="" className="h-24 w-24 rounded-lg object-cover border" />
              {img.isPrimary && <span className="absolute top-1 left-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">Ana</span>}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {pendingUrls.map((url, i) => (
            <div key={`pending-${i}`} className="relative group">
              <img src={url} alt="" className="h-24 w-24 rounded-lg object-cover border opacity-70" />
              {savedImages.length === 0 && i === 0 && <span className="absolute top-1 left-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">Ana</span>}
              <button
                type="button"
                onClick={() => setPendingUrls((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${imageLoading ? 'opacity-50 cursor-wait' : 'text-muted-foreground hover:border-primary hover:text-primary'}`}>
            <Plus className="h-6 w-6" />
            <span className="text-xs mt-1">{imageLoading ? 'Yükleniyor...' : 'Görsel Ekle'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={imageLoading}
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (files.length) handleUpload(files);
              }}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP — maks. 5 MB.{isEditing ? ' Silme ve ekleme anında kaydedilir.' : ' İlk görsel ana görsel olur.'}</p>
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
