import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const CARD_W = 220;
const CARD_H = 300;
const AUTO_INTERVAL = 3500;

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

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(timer);
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

  if (images.length === 0) return null;

  const getIndex = (offset: number) =>
    (current + offset + images.length) % images.length;

  const slots = [
    { offset: -2, xPercent: -130, scale: 0.45, z: 0, opacity: 0.2, blur: 4 },
    { offset: -1, xPercent: -65,  scale: 0.9,  z: 1, opacity: 0.7, blur: 2 },
    { offset: 0,  xPercent: 0,    scale: 1,    z: 2, opacity: 1,   blur: 0 },
    { offset: 1,  xPercent: 65,   scale: 0.9,  z: 1, opacity: 0.7, blur: 2 },
    { offset: 2,  xPercent: 130,  scale: 0.45, z: 0, opacity: 0.2, blur: 4 },
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
          const baseX = (slot.xPercent / 100) * CARD_W;
          return (
            <motion.div
              key={`slot-${slot.offset}`}
              className="absolute"
              style={{ zIndex: slot.z }}
              animate={{
                x: baseX,
                scale: slot.scale,
                opacity: slot.opacity,
              }}
              transition={{
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  boxShadow:
                    slot.offset === 0
                      ? "0 4px 20px hsl(340 40% 50% / 0.15)"
                      : "0 2px 10px hsl(0 0% 0% / 0.08)",
                  border:
                    slot.offset === 0
                      ? "1.5px solid hsl(340, 50%, 80%)"
                      : "1px solid hsl(340, 20%, 85% / 0.3)",
                  filter: slot.blur > 0 ? `blur(${slot.blur}px)` : "none",
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
