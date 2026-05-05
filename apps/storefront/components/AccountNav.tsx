'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, CreditCard, HelpCircle, ShoppingBag, Star, Tag, Eye, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navSections: { title: string; items: { href: string; label: string; Icon: LucideIcon }[] }[] = [
  {
    title: 'Hesabım & Yardım',
    items: [
      { href: '/account/profile', label: 'Kullanıcı Bilgilerim', Icon: User },
      { href: '/account/addresses', label: 'Adres Bilgilerim', Icon: MapPin },
      { href: '/account/payment', label: 'Ödeme Bilgilerim', Icon: CreditCard },
      { href: '/account/help', label: 'Yardım', Icon: HelpCircle },
    ],
  },
  {
    title: 'Siparişlerim',
    items: [
      { href: '/account/orders', label: 'Tüm Siparişlerim', Icon: ShoppingBag },
      { href: '/account/reviews', label: 'Değerlendirmelerim', Icon: Star },
    ],
  },
  {
    title: 'Sana Özel',
    items: [
      { href: '/favorites', label: 'Favorilerim', Icon: Heart },
      { href: '/account/coupons', label: 'İndirim Kuponlarım', Icon: Tag },
      { href: '/account/recently-viewed', label: 'Önceden Gezdiğim', Icon: Eye },
    ],
  },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-4">
      {navSections.map((section) => (
        <div key={section.title} className="rounded-xl border p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {section.title}
          </p>
          {section.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                }`}
              >
                <item.Icon
                  className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
