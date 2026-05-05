'use client';

import { Heart } from 'lucide-react';
import { useFavorites, type FavoriteItem } from '@/components/FavoritesProvider';

interface Props {
  item: FavoriteItem;
}

export default function FavoriteButton({ item }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const favorited = isFavorite(item.productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:scale-110 active:scale-95 ${
        favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
      }`}
      title={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
    >
      <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
    </button>
  );
}
