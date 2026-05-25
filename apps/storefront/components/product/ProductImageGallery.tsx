'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import type { ProductImage } from '@saas/api-client';

interface Props {
  images: ProductImage[];
  productName: string;
  selectedColor?: string;
  onColorFromImage?: (color: string) => void;
}

export default function ProductImageGallery({
  images,
  productName,
  selectedColor,
  onColorFromImage,
}: Props) {
  const initialIndex = Math.max(images.findIndex((i) => i.isPrimary), 0);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: 'center center',
    transform: 'scale(1)',
  });

  const displayedIndex = useMemo(() => {
    if (selectedColor) {
      const idx = images.findIndex(
        (img) => img.altText?.trim().toLowerCase() === selectedColor.toLowerCase(),
      );
      if (idx >= 0) return idx;
    }
    return selectedIndex;
  }, [images, selectedColor, selectedIndex]);

  const displayed = images[displayedIndex] ?? images[0];

  const goTo = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      const img = images[index];
      if (img?.altText && onColorFromImage) onColorFromImage(img.altText);
    },
    [images, onColorFromImage],
  );

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    goTo((displayedIndex - 1 + images.length) % images.length);
  }, [displayedIndex, goTo, images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    goTo((displayedIndex + 1) % images.length);
  }, [displayedIndex, goTo, images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, goPrev, goNext]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: 'scale(2)' });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: 'center center', transform: 'scale(1)' });
  };

  return (
    <>
      <div className="space-y-3">
        <div
          className="group relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => displayed && setLightboxOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && displayed && setLightboxOpen(true)}
          aria-label="Görseli büyüt"
        >
          {displayed ? (
            <Image
              src={displayed.url}
              alt={displayed.altText ?? productName}
              fill
              className="object-cover transition-transform duration-200 ease-out"
              style={zoomStyle}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Görsel yok
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
            <ZoomIn className="h-3.5 w-3.5" />
            Büyüt
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                aria-label="Önceki görsel"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                aria-label="Sonraki görsel"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  displayedIndex === index
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-gray-200 opacity-75 hover:opacity-100'
                }`}
              >
                <Image src={img.url} alt={img.altText ?? ''} fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && displayed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
          <div
            className="relative h-[min(85vh,800px)] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayed.url}
              alt={displayed.altText ?? productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {images.length > 1 && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/80">
              {displayedIndex + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
