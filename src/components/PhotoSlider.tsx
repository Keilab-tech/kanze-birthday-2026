import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const CARD_W = 200;
const CARD_GAP = 20;
const STEP = CARD_W + CARD_GAP;
const SPEED = 0.6; // px per frame

const PhotoSlider = () => {
  const [images, setImages] = useState<string[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const applyTransforms = useCallback(() => {
    const track = trackRef.current;
    if (!track || containerWidth === 0) return;
    const center = containerWidth / 2;
    const children = track.children as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childCenter = child.offsetLeft + CARD_W / 2 + offsetRef.current;
      const dist = Math.abs(childCenter - center);
      const maxDist = containerWidth / 2;
      const t = Math.min(dist / maxDist, 1);
      // scale: 1 at center → 0.75 at edges
      const scale = 1 - t * 0.25;
      // opacity: 1 at center → 0.4 at edges
      const opacity = 1 - t * 0.6;
      // slight brightness dim
      const brightness = 1 - t * 0.3;
      child.style.transform = `scale(${scale})`;
      child.style.opacity = `${opacity}`;
      child.style.filter = `brightness(${brightness})`;
    }
  }, [containerWidth]);

  useEffect(() => {
    if (images.length === 0 || containerWidth === 0) return;
    const totalWidth = images.length * STEP;

    const animate = () => {
      offsetRef.current -= SPEED;
      if (Math.abs(offsetRef.current) >= totalWidth) {
        offsetRef.current += totalWidth;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      applyTransforms();
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [images, containerWidth, applyTransforms]);

  if (images.length === 0) return null;

  // Triple the images for seamless infinite loop
  const tripled = [...images, ...images, ...images];

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <div
        ref={trackRef}
        className="flex items-center h-full absolute left-0 top-0"
        style={{ gap: CARD_GAP, willChange: "transform" }}
      >
        {tripled.map((url, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              width: CARD_W,
              height: 280,
              transition: "transform 0.1s linear, opacity 0.1s linear, filter 0.1s linear",
              boxShadow: "0 8px 30px hsl(340 60% 40% / 0.2)",
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
