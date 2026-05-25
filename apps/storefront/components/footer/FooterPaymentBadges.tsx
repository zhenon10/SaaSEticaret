import { CreditCard, Landmark } from 'lucide-react';

export default function FooterPaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/10 py-6 text-white/80">
      <div className="flex items-center gap-2 text-xs font-medium">
        <CreditCard className="h-4 w-4" />
        Kredi / Banka Kartı
      </div>
      <span className="hidden h-4 w-px bg-white/20 sm:block" />
      <div className="flex items-center gap-2 text-xs font-medium">
        <Landmark className="h-4 w-4" />
        Havale / EFT
      </div>
      <span className="hidden h-4 w-px bg-white/20 sm:block" />
      <span className="text-xs">256-bit SSL güvenli ödeme</span>
    </div>
  );
}
