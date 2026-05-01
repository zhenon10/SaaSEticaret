import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus } from 'lucide-react';
import DeleteCategoryButton from '@/components/DeleteCategoryButton';
import type { Category } from '@saas/api-client';

export const metadata: Metadata = { title: 'Kategoriler' };

function CategoryRow({ category, level = 0 }: { category: Category; level?: number }) {
  return (
    <>
      <tr className="hover:bg-muted/30">
        <td className="px-4 py-3">
          <span style={{ marginLeft: `${level * 20}px` }} className="inline-flex items-center gap-1">
            {level > 0 && <span className="text-muted-foreground">└</span>}
            {category.name}
          </span>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{category.slug}</td>
        <td className="px-4 py-3 text-center text-muted-foreground">{category.displayOrder}</td>
        <td className="px-4 py-3 text-center">
          <span className={`rounded-full px-2 py-1 text-xs ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
            {category.isActive ? 'Aktif' : 'Pasif'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
          </div>
        </td>
      </tr>
      {category.children?.map((child) => (
        <CategoryRow key={child.id} category={child} level={level + 1} />
      ))}
    </>
  );
}

export default async function CategoriesPage() {
  let tree: Category[] = [];
  try {
    tree = await api.catalog.getCategoryTree();
  } catch { /* ignore */ }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kategoriler</h1>
        <Link
          href="/categories/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Yeni Kategori
        </Link>
      </div>

      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">İsim</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-center font-medium">Sıra</th>
              <th className="px-4 py-3 text-center font-medium">Durum</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tree.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Kategori bulunamadı.
                </td>
              </tr>
            ) : (
              tree.map((cat) => <CategoryRow key={cat.id} category={cat} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
