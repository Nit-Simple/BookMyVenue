import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grid3x3, X } from 'lucide-react';

export function VenueGallery({ images, name }: { images: string[]; name: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const open = (i: number) => setLightbox(i);
  const close = () => setLightbox(null);
  const prev = () => setLightbox((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const next = () => setLightbox((i) => (i === null ? null : (i + 1) % images.length));

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-[420px]">
        <button
          onClick={() => open(0)}
          className="group relative col-span-4 row-span-2 sm:col-span-2"
        >
          <img
            src={images[0]}
            alt={name}
            className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-full"
          />
        </button>
        {images.slice(1, 5).map((img, i) => (
          <button
            key={i}
            onClick={() => open(i + 1)}
            className="group relative hidden sm:block"
          >
            <img
              src={img}
              alt={`${name} ${i + 2}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {i === 3 && images.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-sm font-semibold text-white">
                <Grid3x3 className="mr-1.5 h-4 w-4" /> +{images.length - 5} photos
              </span>
            )}
          </button>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
          {lightbox !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 p-4"
              onClick={close}
            >
              <button
                onClick={close}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Close gallery"
              >
                <X className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <motion.img
                key={lightbox}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                src={images[lightbox]}
                alt={`${name} ${lightbox + 1}`}
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {lightbox + 1} / {images.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
