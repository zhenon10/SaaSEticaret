import ProductCard from '@/components/ProductCard';
import type { ProductListItem } from '@saas/api-client';

interface Props {
  products: ProductListItem[];
  title?: string;
}

export default function RelatedProducts({ products, title = 'Benzer Ürünler' }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-gray-200 bg-gray-50/50 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-7 w-1 rounded-full bg-primary" />
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
