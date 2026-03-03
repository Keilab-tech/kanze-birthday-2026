import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SWIPE_THRESHOLD = 50;
const CARD_W = 220;
const CARD_H = 300;

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
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
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    // Dampen the drag so it feels elastic
    setDragOffset(delta * 0.4);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    const d = dragOffset;
    setDragOffset(0);
    if (d < -20) next();
    else if (d > 20) prev();
  };

  if (images.length === 0) return null;

  const getIndex = (offset: number) =>
    (current + offset + images.length) % images.length;

  const slots = [
    { offset: -2, xBase: -1.3 * CARD_W, scale: 0.45, z: 0, opacity: 0.25 },
    { offset: -1, xBase: -0.65 * CARD_W, scale: 0.7, z: 1, opacity: 0.6 },
    { offset: 0, xBase: 0, scale: 1, z: 2, opacity: 1 },
    { offset: 1, xBase: 0.65 * CARD_W, scale: 0.7, z: 1, opacity: 0.6 },
    { offset: 2, xBase: 1.3 * CARD_W, scale: 0.45, z: 0, opacity: 0.25 },
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
        {slots.map((slot) => {
          const idx = getIndex(slot.offset);
          return (
            <motion.div
              key={`slot-${slot.offset}`}
              className="absolute"
              style={{ zIndex: slot.z }}
              animate={{
                x: slot.xBase + dragOffset,
                scale: slot.scale,
                opacity: slot.opacity,
              }}
              transition={
                isDragging.current
                  ? { type: "tween", duration: 0.05 }
                  : { type: "spring", stiffness: 300, damping: 30 }
              }
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  boxShadow:
                    slot.offset === 0
                      ? "0 0 30px hsl(340 80% 60% / 0.5), 0 10px 40px hsl(340 60% 40% / 0.3)"
                      : "0 4px 15px hsl(0 0% 0% / 0.15)",
                  border:
                    slot.offset === 0
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
