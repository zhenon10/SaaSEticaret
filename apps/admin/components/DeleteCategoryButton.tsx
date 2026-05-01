'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Props { categoryId: string; categoryName: string }

export default function DeleteCategoryButton({ categoryId, categoryName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) return;
    setLoading(true);
    try {
      await api.catalog.deleteCategory(categoryId);
      router.refresh();
    } catch {
      alert('Silme işlemi başarısız. Alt kategorisi veya ürünü olan kategoriler silinemez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      Sil
    </button>
  );
}
