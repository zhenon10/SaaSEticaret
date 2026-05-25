'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SIZE_ROWS = [
  { eu: '36', cm: '23.0', uk: '3.5' },
  { eu: '37', cm: '23.5', uk: '4' },
  { eu: '38', cm: '24.0', uk: '5' },
  { eu: '39', cm: '24.5', uk: '6' },
  { eu: '40', cm: '25.0', uk: '6.5' },
  { eu: '41', cm: '25.5', uk: '7.5' },
  { eu: '42', cm: '26.0', uk: '8' },
  { eu: '43', cm: '26.5', uk: '9' },
  { eu: '44', cm: '27.0', uk: '9.5' },
  { eu: '45', cm: '27.5', uk: '10.5' },
];

export default function SizeGuideModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="size-guide-title" className="text-lg font-bold text-gray-900">
            Beden Rehberi (EU)
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-auto px-5 py-4">
          <p className="mb-4 text-sm text-gray-600">
            Ayağınızı kağıda basılı tutup topuktan en uzun parmak ucuna kadar ölçün (cm). Tabloya en yakın EU numarasını seçin.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-semibold">EU</th>
                <th className="pb-2 font-semibold">Ayak (cm)</th>
                <th className="pb-2 font-semibold">UK</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_ROWS.map((row) => (
                <tr key={row.eu} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 font-medium text-gray-900">{row.eu}</td>
                  <td className="py-2.5 text-gray-600">{row.cm}</td>
                  <td className="py-2.5 text-gray-600">{row.uk}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-gray-500">
            İki numara arasında kalıyorsanız geniş ayak veya kalın çorap için büyük numarayı tercih edin.
          </p>
        </div>
      </div>
    </div>
  );
}
