import Link from 'next/link';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

interface Props {
  email: string;
  phone: string;
  phoneDigits: string;
  hours: string;
  address: string;
  whatsappEnabled: boolean;
  compact?: boolean;
}

export default function FooterContact({
  email,
  phone,
  phoneDigits,
  hours,
  address,
  whatsappEnabled,
  compact = false,
}: Props) {
  const hasAny = email || phone || hours || address;
  if (!hasAny) return null;

  return (
    <div>
      {!compact && (
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">İletişim</h4>
      )}
      <ul className="space-y-3 text-sm text-white/75">
        {address && (
          <li className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
            <span className="whitespace-pre-line">{address}</span>
          </li>
        )}
        {email && (
          <li>
            <Link href={`mailto:${email}`} className="flex items-center gap-2 transition-colors hover:text-white">
              <Mail className="h-4 w-4 shrink-0 text-white/50" />
              {email}
            </Link>
          </li>
        )}
        {phone && (
          <li>
            <Link href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 transition-colors hover:text-white">
              <Phone className="h-4 w-4 shrink-0 text-white/50" />
              {phone}
            </Link>
          </li>
        )}
        {hours && (
          <li className="flex gap-2">
            <Clock className="h-4 w-4 shrink-0 text-white/50" />
            <span>{hours}</span>
          </li>
        )}
        {whatsappEnabled && phoneDigits && (
          <li>
            <Link
              href={`https://wa.me/${phoneDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/20 px-3 py-1.5 font-medium text-[#7dffb3] transition-colors hover:bg-[#25D366]/30"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
