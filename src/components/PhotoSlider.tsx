import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CARD_W = 220;
const CARD_H = 300;
const AUTO_INTERVAL = 3500;
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];

/* ── Hard-coded gallery photos — served from public/images/gallery/ ── */
const GALLERY_PHOTOS = [
  "/images/gallery/photo1.jpeg",
  "/images/gallery/photo2.jpeg",
  "/images/gallery/photo3.jpeg",
  "/images/gallery/photo4.jpeg",
  "/images/gallery/photo5.jpeg",
];

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>(GALLERY_PHOTOS);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(true);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/media/gallery")
      .then((r) => r.json())
      .then((data: { url: string; name: string; isVideo: boolean }[]) => {
        const apiUrls = data
          .filter((f) => {
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            return IMAGE_EXTS.includes(ext) && !f.isVideo;
          })
          .map((f) => f.url);
        /* Merge: hardcoded first, then any newly uploaded ones not already listed */
        const combined = [...GALLERY_PHOTOS];
        apiUrls.forEach((url) => {
          const decoded = decodeURIComponent(url);
          const alreadyIn = combined.some((c) => decodeURIComponent(c) === decoded);
          if (!alreadyIn) combined.push(url);
        });
        setImages(combined);
      })
      .catch(() => { /* keep hardcoded fallback */ });
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (images.length > 0 ? (prev + 1) % images.length : 0));
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((prev) =>
      images.length > 0 ? (prev - 1 + images.length) % images.length : 0,
    );
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    autoRef.current = setInterval(next, AUTO_INTERVAL);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [next, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    if (touchDelta.current < -40) next();
    else if (touchDelta.current > 40) prev();
    touchDelta.current = 0;
  };

  /* Empty / loading state */
  if (!loaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "hsl(340, 50%, 75%)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div
          className="rounded-3xl flex flex-col items-center justify-center gap-2 px-10 py-8"
          style={{
            background: "hsl(340, 60%, 92% / 0.7)",
            border: "1.5px dashed hsl(340, 50%, 75%)",
          }}
        >
          <span className="text-3xl">📸</span>
          <p
            className="text-sm text-center"
            style={{ color: "hsl(340, 45%, 55%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Your memories will appear here
          </p>
          <p
            className="text-xs text-center"
            style={{ color: "hsl(340, 35%, 65%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Add photos in Gallery ✨
          </p>
        </div>
      </div>
    );
  }

  const getIndex = (offset: number) =>
    (current + offset + images.length) % images.length;

  const slots = [
    { offset: -1, xPercent: -68, scale: 0.82, z: 1, opacity: 0.55, blur: 2 },
    { offset:  0, xPercent:   0, scale: 1,    z: 2, opacity: 1,    blur: 0 },
    { offset:  1, xPercent:  68, scale: 0.82, z: 1, opacity: 0.55, blur: 2 },
  ];

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {slots.map((slot) => {
            const idx = getIndex(slot.offset);
            const baseX = (slot.xPercent / 100) * CARD_W;
            return (
              <motion.div
                key={`${slot.offset}-${idx}`}
                className="absolute"
                style={{ zIndex: slot.z }}
                initial={{ opacity: 0, x: baseX, scale: slot.scale }}
                animate={{
                  x: baseX,
                  scale: slot.scale,
                  opacity: slot.opacity,
                  filter: slot.blur > 0 ? `blur(${slot.blur}px)` : "none",
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    boxShadow:
                      slot.offset === 0
                        ? "0 6px 24px hsl(340 40% 50% / 0.2)"
                        : "0 2px 8px hsl(0 0% 0% / 0.06)",
                    border:
                      slot.offset === 0
                        ? "1.5px solid hsl(340, 50%, 80%)"
                        : "none",
                  }}
                >
                  <img
                    src={images[idx]}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading="eager"
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                background:
                  i === current
                    ? "hsl(340, 60%, 65%)"
                    : "hsl(340, 40%, 80%)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoSlider;
