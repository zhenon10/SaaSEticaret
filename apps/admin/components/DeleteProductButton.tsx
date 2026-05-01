'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Props { productId: string; productName: string }

export default function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) return;
    setLoading(true);
    try {
      await api.catalog.deleteProduct(productId);
      router.refresh();
    } catch {
      alert('Silme işlemi başarısız oldu.');
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
