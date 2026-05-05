'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

export default function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex flex-col items-center gap-0.5 text-gray-600 transition-colors hover:text-primary"
    >
      <div className="relative">
        <ShoppingBag className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
      <span className="text-[11px]">Sepetim</span>
    </Link>
  );
}
