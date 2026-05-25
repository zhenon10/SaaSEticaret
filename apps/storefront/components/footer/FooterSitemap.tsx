import Link from 'next/link';
import type { FooterLink } from '@/lib/footer';

interface Props {
  links: FooterLink[];
}

export default function FooterSitemap({ links }: Props) {
  if (links.length === 0) return null;

  return (
    <div className="border-t border-white/10 py-6">
      <div className="container mx-auto px-4">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-white/50">
          Hızlı Erişim
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {links.map((l) => (
            <Link
              key={`${l.href}-${l.label}`}
              href={l.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
