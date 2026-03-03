import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.storage
        .from("kanze-birthday")
        .list("gallery", { limit: 100, sortBy: { column: "name", order: "asc" } });
      if (!data) return;
      const urls = data
        .filter(f => {
          const ext = f.name.split(".").pop()?.toLowerCase() || "";
          return !f.name.startsWith(".") && ["jpg", "jpeg", "png", "webp"].includes(ext);
        })
        .map(f => {
          const { data: u } = supabase.storage.from("kanze-birthday").getPublicUrl(`gallery/${f.name}`);
          return u.publicUrl;
        });
      setImages(urls);
    };
    load();
  }, []);

  const next = useCallback(() => {
    if (images.length === 0) return;
    setDirection(1);
    setCurrent(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    if (images.length === 0) return;
    setDirection(-1);
    setCurrent(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-slide every 4s
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, images.length]);

  if (images.length === 0) return null;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="w-full max-w-sm mx-auto relative overflow-hidden rounded-2xl" style={{ aspectRatio: "4/3" }}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={current}
          src={images[current]}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl"
          alt=""
          draggable={false}
        />
      </AnimatePresence>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: "hsl(340, 60%, 85% / 0.8)", color: "hsl(340, 40%, 30%)" }}
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: "hsl(340, 60%, 85% / 0.8)", color: "hsl(340, 40%, 30%)" }}
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i === current ? "hsl(340, 80%, 70%)" : "hsl(0, 0%, 100% / 0.5)",
                transform: i === current ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoSlider;
