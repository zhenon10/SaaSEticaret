import type { Metadata } from 'next';
import { api } from '@/lib/api';
import CartProvider from '@/components/CartProvider';
import './globals.css';

function hexToHsl(hex: string): string | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Gradient bitiş rengini primary'den otomatik hesapla:
// Renkli (saturated) renklerde tonu +20° kaydır ve aydınlat.
// Renksiz (siyah/beyaz/gri) renklerde sadece aydınlat.
function computePrimaryEnd(hsl: string): string {
  const m = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!m) return hsl;
  const [, h, s, l] = m.map(Number);
  if (s <= 10) {
    return `${h} ${s}% ${Math.min(l + 28, 90)}%`;
  }
  return `${(h + 20) % 360} ${Math.max(s - 10, 0)}% ${Math.min(l + 18, 88)}%`;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await api.settings.getAll();
    const name = settings['store.name'] || 'Mağaza';
    return {
      title: { default: name, template: `%s | ${name}` },
      description: 'Online alışveriş platformu',
    };
  } catch {
    return {
      title: { default: 'Mağaza', template: '%s | Mağaza' },
      description: 'Online alışveriş platformu',
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let primaryHsl: string | null = null;
  let primaryEndHsl: string | null = null;
  try {
    const settings = await api.settings.getAll();
    const hex = settings['store.color.primary'];
    if (hex) {
      primaryHsl    = hexToHsl(hex);
      primaryEndHsl = primaryHsl ? computePrimaryEnd(primaryHsl) : null;
    }
  } catch { /* use CSS defaults */ }

  const customCss = primaryHsl
    ? `:root { --primary: ${primaryHsl}; --ring: ${primaryHsl}; --primary-end: ${primaryEndHsl ?? primaryHsl}; }`
    : '';

  return (
    <html lang="tr">
      <body className="min-h-screen bg-background font-sans antialiased">
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
