'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/components/FavoritesProvider';

export default function FavoriteBadge() {
  const { count } = useFavorites();

  return (
    <Link
      href="/favorites"
      className="relative flex flex-col items-center gap-0.5 text-gray-600 transition-colors hover:text-primary"
    >
      <div className="relative">
        <Heart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
      <span className="text-[11px]">Favorilerim</span>
    </Link>
  );
}
