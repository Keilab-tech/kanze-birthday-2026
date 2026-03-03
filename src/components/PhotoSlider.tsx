import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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

  // Auto-slide every 2s (2x speed)
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 2000);
    return () => clearInterval(timer);
  }, [next, images.length]);

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
    <div className="w-full relative overflow-hidden" style={{ height: 280 }}>
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
                  width: 180,
                  height: 240,
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
