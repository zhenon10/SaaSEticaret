'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full items-center">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ürün veya kategori ara"
        className="h-10 w-full rounded-full border-2 border-gray-200 pl-5 pr-12 text-sm outline-none transition-colors focus:border-primary"
      />
      <button
        type="submit"
        className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
