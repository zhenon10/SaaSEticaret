'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Menu, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null | undefined;
  isActive: boolean;
}

interface Props {
  categories: Category[];
}

export default function CategoryFlyout({ categories }: Props) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roots    = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  function openMenu()  {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }
  function closeMenu() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-full shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <Menu className="h-4 w-4" />
        <span className="hidden sm:inline">TÜM KATEGORİLER</span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 min-w-56 rounded-b-lg border border-gray-100 bg-white py-2 shadow-lg"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          {roots.length === 0 && (
            <Link
              href="/products"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Tüm Ürünler
            </Link>
          )}

          {roots.map((root) => {
            const subs = children.filter((c) => c.parentId === root.id);
            return (
              <div key={root.id}>
                <Link
                  href={`/products?category=${root.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:text-primary"
                >
                  {root.name}
                  {subs.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                </Link>
                {subs.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/products?category=${sub.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center py-1.5 pl-8 pr-4 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
