import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGallery } from "@/contexts/GalleryContext";

const CARD_W = 220;
const CARD_H = 300;
const AUTO_INTERVAL = 3500;

const PhotoSlider = () => {
  const { photos, loading } = useGallery();
  const images = photos.filter((p) => !p.isVideo).map((p) => p.url);

  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchDelta  = useRef(0);
  const autoRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Reset index when image list changes */
  useEffect(() => {
    setCurrent((c) => (images.length === 0 ? 0 : c % images.length));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((prev) => (images.length > 0 ? (prev + 1) % images.length : 0));
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((prev) =>
      images.length > 0 ? (prev - 1 + images.length) % images.length : 0
    );
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    autoRef.current = setInterval(next, AUTO_INTERVAL);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [next, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current  = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    if (touchDelta.current < -40) next();
    else if (touchDelta.current > 40) prev();
    touchDelta.current = 0;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "hsl(340, 50%, 75%)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="rounded-3xl flex flex-col items-center justify-center gap-2 px-10 py-8"
          style={{ background: "hsl(340, 60%, 92% / 0.7)", border: "1.5px dashed hsl(340, 50%, 75%)" }}>
          <span className="text-3xl">📸</span>
          <p className="text-sm text-center"
            style={{ color: "hsl(340, 45%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
            Your memories will appear here
          </p>
          <p className="text-xs text-center"
            style={{ color: "hsl(340, 35%, 65%)", fontFamily: "'Quicksand', sans-serif" }}>
            Add photos in Gallery ✨
          </p>
        </div>
      </div>
    );
  }

  const getIndex = (offset: number) => (current + offset + images.length) % images.length;
  const slots = [
    { offset: -1, scale: 0.82, x: -CARD_W * 0.72, z: 0, opacity: 0.55 },
    { offset:  0, scale: 1.00, x: 0,               z: 2, opacity: 1    },
    { offset:  1, scale: 0.82, x:  CARD_W * 0.72,  z: 0, opacity: 0.55 },
  ];

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false}>
        {slots.map((slot) => {
          const idx = getIndex(slot.offset);
          return (
            <motion.div
              key={`${slot.offset}-${images[idx]}`}
              initial={{ opacity: 0, scale: slot.scale * 0.9, x: slot.x }}
              animate={{ opacity: slot.opacity, scale: slot.scale, x: slot.x, zIndex: slot.z }}
              exit={{ opacity: 0, scale: slot.scale * 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{ position: "absolute" }}
              onClick={slot.offset !== 0 ? (slot.offset < 0 ? prev : next) : undefined}
            >
              <div
                className="rounded-3xl overflow-hidden flex-shrink-0"
                style={{
                  width: CARD_W, height: CARD_H,
                  boxShadow: slot.offset === 0
                    ? "0 6px 24px hsl(340 40% 50% / 0.2)"
                    : "0 2px 8px hsl(0 0% 0% / 0.06)",
                  border: slot.offset === 0 ? "1.5px solid hsl(340, 50%, 80%)" : "none",
                }}
              >
                <img src={images[idx]} alt="" className="w-full h-full object-cover"
                  draggable={false} loading="eager" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 16 : 6, height: 6,
                background: i === current ? "hsl(340, 60%, 65%)" : "hsl(340, 40%, 80%)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoSlider;
