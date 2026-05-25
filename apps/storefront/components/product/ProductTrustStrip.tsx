import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';

export interface TrustItem {
  title: string;
  subtitle: string;
}

interface Props {
  items: TrustItem[];
}

const ICONS = [Truck, RotateCcw, ShieldCheck] as const;

export default function ProductTrustStrip({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-4 sm:grid-cols-3">
      {items.map((item, i) => {
        const Icon = ICONS[i] ?? Truck;
        return (
          <div key={item.title} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 leading-snug">{item.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
