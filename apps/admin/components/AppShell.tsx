'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Package, Tags, ShoppingBag, Warehouse, Settings, LogOut, UserCog, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/products',   label: 'Ürünler',       icon: Package },
  { href: '/categories', label: 'Kategoriler',   icon: Tags },
  { href: '/orders',     label: 'Siparişler',    icon: ShoppingBag },
  { href: '/inventory',  label: 'Stok',          icon: Warehouse },
  { href: '/settings',   label: 'Site Ayarları', icon: Settings },
  { href: '/account',    label: 'Hesabım',       icon: UserCog },
];

function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    onItemClick?.();
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-muted text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-muted p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-muted">
        <div className="flex h-14 items-center border-b border-sidebar-muted px-5">
          <span className="text-lg font-bold">Admin</span>
        </div>
        <NavLinks />
      </aside>

      {/* ── Mobile Overlay ───────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-muted px-4">
          <span className="text-lg font-bold">Admin</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks onItemClick={() => setOpen(false)} />
      </aside>

      {/* ── Main Area ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-sidebar px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sidebar-foreground">Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
