'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tags, ShoppingBag, Warehouse, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const nav = [
  { href: '/products',   label: 'Ürünler',     icon: Package },
  { href: '/categories', label: 'Kategoriler', icon: Tags },
  { href: '/orders',     label: 'Siparişler',  icon: ShoppingBag },
  { href: '/inventory',  label: 'Stok',        icon: Warehouse },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-muted px-6">
        <span className="text-lg font-bold">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-muted text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-muted p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
