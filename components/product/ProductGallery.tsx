"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  altText: string | null;
  isLifestyle?: boolean;
}

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const allImages = images.length > 0 ? images : [{ id: "placeholder", url: "/images/product-bow-1.png", altText: "Product" }];

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? allImages.length - 1 : c - 1)), [allImages.length]);
  const next = useCallback(() => setCurrent((c) => (c === allImages.length - 1 ? 0 : c + 1)), [allImages.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      if (Math.abs(deltaX) < 40 || Math.abs(deltaY) > Math.abs(deltaX)) return;

      if (deltaX < 0) {
        next();
      } else {
        prev();
      }
    },
    [next, prev]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "Escape" && lightboxOpen) {
        setLightboxOpen(false);
      }
    };

    if (lightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [prev, next, lightboxOpen]);

  return (
    <>
      <div className="space-y-4 outline-none" ref={containerRef} tabIndex={0}>
        <div
          className="relative aspect-square bg-card rounded-xl overflow-hidden cursor-zoom-in group touch-pan-y"
          onClick={() => setLightboxOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseMove={(e) => {
            if (!zoomed) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            const img = e.currentTarget.querySelector("img");
            if (img) {
              img.style.transformOrigin = `${x}% ${y}%`;
            }
          }}
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allImages[current].url}
            alt={allImages[current].altText ?? "Product image"}
            className={`w-full h-full object-cover transition-transform duration-300 ${zoomed ? "scale-150" : "scale-100"}`}
            draggable={false}
          />
          {allImages[current].isLifestyle && (
            <span className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-md">
              In Action
            </span>
          )}
          <button
            className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-sm rounded-lg text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            {current + 1} / {allImages.length}
          </div>
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                  i === current ? "border-primary" : "border-transparent hover:border-white/20"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="absolute top-4 right-4 p-3 text-white/70 hover:text-white z-10" onClick={() => setLightboxOpen(false)}>
            <X className="w-6 h-6" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allImages[current].url}
            alt={allImages[current].altText ?? "Product image"}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {current + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  );
}
