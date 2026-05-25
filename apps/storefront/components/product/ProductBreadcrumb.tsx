import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { categoryProductsHref } from '@/lib/categories';

interface Props {
  category?: { name: string; slug: string };
  productName: string;
}

export default function ProductBreadcrumb({ category, productName }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-primary transition-colors">
            Ana Sayfa
          </Link>
        </li>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        <li>
          <Link href="/products" className="hover:text-primary transition-colors">
            Ürünler
          </Link>
        </li>
        {category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
            <li>
              <Link href={categoryProductsHref(category.slug)} className="hover:text-primary transition-colors">
                {category.name}
              </Link>
            </li>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        <li className="font-medium text-gray-800 line-clamp-1" aria-current="page">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
