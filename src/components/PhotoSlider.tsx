import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SWIPE_THRESHOLD = 50;
const CARD_W = 220;
const CARD_H = 300;

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const dragX = useMotionValue(0);
  const smoothX = useSpring(dragX, { stiffness: 300, damping: 30 });
  const touchStartX = useRef(0);
  const isDragging = useRef(false);

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
    isDragging.current = true;
    dragX.jump(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    dragX.set(delta);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    const delta = dragX.get();
    if (delta < -SWIPE_THRESHOLD) {
      next();
    } else if (delta > SWIPE_THRESHOLD) {
      prev();
    }
    animate(dragX, 0, { duration: 0.3, ease: "easeOut" });
  };

  if (images.length === 0) return null;

  const getIndex = (offset: number) =>
    (current + offset + images.length) % images.length;

  const basePositions = [
    { offset: -2, xPercent: -130, scale: 0.45, z: 0, opacity: 0.25 },
    { offset: -1, xPercent: -65,  scale: 0.7,  z: 1, opacity: 0.6 },
    { offset: 0,  xPercent: 0,    scale: 1,    z: 2, opacity: 1 },
    { offset: 1,  xPercent: 65,   scale: 0.7,  z: 1, opacity: 0.6 },
    { offset: 2,  xPercent: 130,  scale: 0.45, z: 0, opacity: 0.25 },
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
        {basePositions.map((pos) => {
          const idx = getIndex(pos.offset);
          const baseX = (pos.xPercent / 100) * CARD_W;
          return (
            <motion.div
              key={`slot-${pos.offset}`}
              className="absolute"
              style={{
                zIndex: pos.z,
                x: smoothX,
              }}
              animate={{
                x: baseX,
                scale: pos.scale,
                opacity: pos.opacity,
              }}
              transition={{
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  width: CARD_W,
                  height: CARD_H,
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
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoSlider;
