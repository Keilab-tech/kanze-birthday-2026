import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SWIPE_THRESHOLD = 40;

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  

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


  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchDelta.current < -SWIPE_THRESHOLD) {
      next();
    } else if (touchDelta.current > SWIPE_THRESHOLD) {
      prev();
    }
    touchDelta.current = 0;
  };

  if (images.length === 0) return null;

  const getIndex = (offset: number) =>
    (current + offset + images.length) % images.length;

  // 5 visible cards with center being largest
  const positions: { offset: number; x: string; scale: number; z: number; opacity: number }[] = [
    { offset: -2, x: "-130%", scale: 0.45, z: 0, opacity: 0.25 },
    { offset: -1, x: "-65%",  scale: 0.7,  z: 1, opacity: 0.6 },
    { offset: 0,  x: "0%",    scale: 1,    z: 2, opacity: 1 },
    { offset: 1,  x: "65%",   scale: 0.7,  z: 1, opacity: 0.6 },
    { offset: 2,  x: "130%",  scale: 0.45, z: 0, opacity: 0.25 },
  ];

  return (
    <div
      className="w-full h-full relative overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {positions.map((pos) => {
          const idx = getIndex(pos.offset);
          return (
            <motion.div
              key={`slot-${pos.offset}`}
              className="absolute"
              style={{ zIndex: pos.z }}
              animate={{
                x: pos.x,
                scale: pos.scale,
                opacity: pos.opacity,
              }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  width: 220,
                  height: "80%",
                  boxShadow:
                    pos.offset === 0
                      ? "0 0 30px hsl(340 80% 60% / 0.5), 0 10px 40px hsl(340 60% 40% / 0.3)"
                      : "0 4px 15px hsl(0 0% 0% / 0.15)",
                  border:
                    pos.offset === 0
                      ? "2px solid hsl(340, 70%, 75%)"
                      : "1px solid hsl(340, 30%, 80% / 0.2)",
                }}
              >
                <img
                  src={images[idx]}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoSlider;
