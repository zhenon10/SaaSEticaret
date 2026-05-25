import type { CSSProperties } from 'react';

/** Yaygın renk adları → swatch arka planı */
const COLOR_MAP: Record<string, string> = {
  siyah: '#1a1a1a',
  beyaz: '#f8f8f8',
  gri: '#9ca3af',
  lacivert: '#1e3a5f',
  mavi: '#3b82f6',
  kırmızı: '#dc2626',
  kirmizi: '#dc2626',
  bordo: '#7f1d1d',
  kahverengi: '#78350f',
  bej: '#d6c4a8',
  nude: '#e8d5c4',
  pembe: '#f472b6',
  turuncu: '#ea580c',
  wheat: '#c4a574',
  yeşil: '#16a34a',
  yesil: '#16a34a',
};

export function getColorSwatchStyle(colorName: string): CSSProperties {
  const key = colorName.trim().toLowerCase();
  const hex = COLOR_MAP[key];
  if (hex) {
    return {
      backgroundColor: hex,
      border: hex === '#f8f8f8' || hex === '#e8d5c4' || hex === '#d6c4a8' ? '1px solid #e5e7eb' : 'none',
    };
  }
  return { background: 'linear-gradient(135deg, #e5e7eb 50%, #9ca3af 50%)' };
}

export function hasColorSwatch(colorName: string): boolean {
  return !!COLOR_MAP[colorName.trim().toLowerCase()];
}
