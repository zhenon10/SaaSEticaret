import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react';

interface Props {
  instagram?: string;
  facebook?: string;
}

export default function FooterSocial({ instagram, facebook }: Props) {
  if (!instagram && !facebook) return null;

  return (
    <div className="flex items-center gap-3">
      {instagram && (
        <Link
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <Instagram className="h-4 w-4" />
        </Link>
      )}
      {facebook && (
        <Link
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <Facebook className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
