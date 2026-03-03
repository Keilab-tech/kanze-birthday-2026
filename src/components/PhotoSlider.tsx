import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const CARD_WIDTH = 200;
const CARD_GAP = 16;
const SPEED = 0.5; // pixels per frame

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

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

  useEffect(() => {
    if (images.length === 0) return;
    const totalWidth = images.length * (CARD_WIDTH + CARD_GAP);

    const animate = () => {
      offsetRef.current -= SPEED;
      // Reset seamlessly when first set scrolls out
      if (Math.abs(offsetRef.current) >= totalWidth) {
        offsetRef.current += totalWidth;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [images]);

  if (images.length === 0) return null;

  // Duplicate images for seamless loop
  const doubled = [...images, ...images];

  return (
    <div className="w-full overflow-hidden" style={{ height: 280 }}>
      <div
        ref={trackRef}
        className="flex items-center h-full"
        style={{ gap: CARD_GAP, willChange: "transform" }}
      >
        {doubled.map((url, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              width: CARD_WIDTH,
              height: 260,
              boxShadow:
                "0 0 20px hsl(340 80% 60% / 0.3), 0 8px 30px hsl(340 60% 40% / 0.2)",
              border: "2px solid hsl(340, 70%, 80% / 0.4)",
            }}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoSlider;
