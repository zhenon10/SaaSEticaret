import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import type { TrustItem } from '@/components/product/ProductTrustStrip';

const ICONS = [Truck, RotateCcw, ShieldCheck] as const;

interface Props {
  items: TrustItem[];
}

export default function FooterTrustBar({ items }: Props) {
  return (
    <div className="border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible">
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Truck;
            return (
              <div key={item.title} className="flex min-w-[200px] shrink-0 items-center gap-3 sm:min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-white/70">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
