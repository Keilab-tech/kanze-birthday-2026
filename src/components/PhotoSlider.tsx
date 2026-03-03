import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

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
    setCurrent(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    if (images.length === 0) return;
    setCurrent(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-slide every 4s
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, images.length]);

  if (images.length === 0) return null;

  const getIndex = (offset: number) =>
    (current + offset + images.length) % images.length;

  // Show 5 cards: -2, -1, 0, +1, +2
  const positions = [
    { offset: -2, x: "-115%", scale: 0.55, z: 0, opacity: 0.3, rotate: -8 },
    { offset: -1, x: "-60%", scale: 0.75, z: 1, opacity: 0.6, rotate: -4 },
    { offset: 0, x: "0%", scale: 1, z: 2, opacity: 1, rotate: 0 },
    { offset: 1, x: "60%", scale: 0.75, z: 1, opacity: 0.6, rotate: 4 },
    { offset: 2, x: "115%", scale: 0.55, z: 0, opacity: 0.3, rotate: 8 },
  ];

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{ height: 220 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {positions.map((pos) => {
          const idx = getIndex(pos.offset);
          return (
            <motion.div
              key={`${pos.offset}-${idx}`}
              className="absolute cursor-pointer"
              style={{ zIndex: pos.z }}
              animate={{
                x: pos.x,
                scale: pos.scale,
                opacity: pos.opacity,
                rotateY: pos.rotate,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={() => {
                if (pos.offset < 0) prev();
                else if (pos.offset > 0) next();
              }}
            >
              <div
                className="rounded-2xl overflow-hidden shadow-lg"
                style={{
                  width: 150,
                  height: 190,
                  boxShadow:
                    pos.offset === 0
                      ? "0 0 30px hsl(340 80% 60% / 0.5), 0 10px 40px hsl(340 60% 40% / 0.3)"
                      : "0 4px 15px hsl(0 0% 0% / 0.2)",
                  border: pos.offset === 0 ? "2px solid hsl(340, 70%, 75%)" : "1px solid hsl(340, 30%, 80% / 0.3)",
                }}
              >
                <img
                  src={images[idx]}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: i === current ? "hsl(340, 80%, 70%)" : "hsl(340, 30%, 70% / 0.4)",
                transform: i === current ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoSlider;
