import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerApi } from '@/lib/server-api';
import { Plus, Pencil } from 'lucide-react';
import DeleteCategoryButton from '@/components/DeleteCategoryButton';
import type { Category } from '@saas/api-client';

export const metadata: Metadata = { title: 'Kategoriler' };

function CategoryRow({ category, level = 0 }: { category: Category; level?: number }) {
  return (
    <>
      <tr className="hover:bg-muted/30">
        <td className="px-3 py-3 lg:px-4">
          <span style={{ marginLeft: `${level * 16}px` }} className="inline-flex items-center gap-1">
            {level > 0 && <span className="text-muted-foreground text-xs">└</span>}
            {category.name}
          </span>
        </td>
        <td className="hidden px-3 py-3 font-mono text-xs text-muted-foreground md:table-cell lg:px-4">
          {category.slug}
        </td>
        <td className="hidden px-3 py-3 text-center text-muted-foreground sm:table-cell lg:px-4">
          {category.displayOrder}
        </td>
        <td className="px-3 py-3 text-center lg:px-4">
          <span className={`rounded-full px-2 py-1 text-xs ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
            {category.isActive ? 'Aktif' : 'Pasif'}
          </span>
        </td>
        <td className="px-3 py-3 text-right lg:px-4">
          <div className="flex justify-end gap-1 lg:gap-2">
            <Link
              href={`/categories/${category.id}/edit`}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors lg:px-3 lg:py-1.5"
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden sm:inline">Düzenle</span>
            </Link>
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
  const api = await getServerApi();
  let tree: Category[] = [];
  try {
    tree = await api.catalog.getCategoryTree();
  } catch { /* ignore */ }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold lg:text-3xl">Kategoriler</h1>
        <Link
          href="/categories/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 lg:gap-2 lg:px-4"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Yeni Kategori</span>
          <span className="sm:hidden">Ekle</span>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-3 text-left font-medium lg:px-4">İsim</th>
              <th className="hidden px-3 py-3 text-left font-medium md:table-cell lg:px-4">Slug</th>
              <th className="hidden px-3 py-3 text-center font-medium sm:table-cell lg:px-4">Sıra</th>
              <th className="px-3 py-3 text-center font-medium lg:px-4">Durum</th>
              <th className="px-3 py-3 text-right font-medium lg:px-4">İşlem</th>
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
