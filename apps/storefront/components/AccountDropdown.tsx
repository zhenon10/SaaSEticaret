'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ChevronDown, ShoppingBag, MapPin, LogOut } from 'lucide-react';

interface Props {
  name: string;
  phone?: string;
}

export default function AccountDropdown({ name, phone }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center gap-0.5 text-gray-600 transition-colors hover:text-primary"
      >
        <span className="flex items-center gap-0.5">
          <User className="h-5 w-5" />
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
        <span className="text-[11px]">Hesabım</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-white shadow-lg">
          {/* Kullanıcı bilgisi */}
          <div className="border-b px-4 py-3">
            <p className="font-semibold text-sm">{name}</p>
            {phone && <p className="text-xs text-muted-foreground mt-0.5">{phone}</p>}
          </div>

          {/* Menü linkleri */}
          <div className="py-1">
            <DropdownLink href="/account/profile" icon={<User className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Hesabım
            </DropdownLink>
            <DropdownLink href="/account/orders" icon={<ShoppingBag className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Siparişlerim
            </DropdownLink>
            <DropdownLink href="/account/addresses" icon={<MapPin className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Adreslerim
            </DropdownLink>
          </div>

          {/* Çıkış */}
          <div className="border-t py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-muted transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Link>
  );
}
