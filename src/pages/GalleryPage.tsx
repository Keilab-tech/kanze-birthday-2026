import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";

interface MediaFile {
  id: number;
  name: string;
  url: string;
  isVideo: boolean;
}

const STATIC_GALLERY: MediaFile[] = [
  { id: 1, name: "photo1.jpeg", url: "/images/gallery/photo1.jpeg", isVideo: false },
  { id: 2, name: "photo2.jpeg", url: "/images/gallery/photo2.jpeg", isVideo: false },
  { id: 3, name: "photo3.jpeg", url: "/images/gallery/photo3.jpeg", isVideo: false },
  { id: 4, name: "photo4.jpeg", url: "/images/gallery/photo4.jpeg", isVideo: false },
  { id: 5, name: "photo5.jpeg", url: "/images/gallery/photo5.jpeg", isVideo: false },
];

const GalleryPage = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGallery = () => {
    fetch("/api/media/gallery")
      .then((r) => r.json())
      .then((data: MediaFile[]) => setFiles(data.length ? data : STATIC_GALLERY))
      .catch(() => setFiles(STATIC_GALLERY))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;

    setUploading(true);
    const uploads = Array.from(picked).map(async (file) => {
      const form = new FormData();
      form.append("file", file);
      await fetch("/api/media/gallery", { method: "POST", body: form });
    });

    try {
      await Promise.all(uploads);
    } finally {
      setUploading(false);
      e.target.value = "";
      setLoading(true);
      loadGallery();
    }
  };

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-hidden">
      <PinkParticlesBackground />

      <div className="relative z-10 p-4 pb-28">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate("/hub")}
          className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center shadow-sm"
          style={{ background: "hsl(340, 60%, 92%)", color: "hsl(340, 40%, 35%)" }}
        >
          ←
        </motion.button>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl text-primary text-center mt-14 mb-8"
        >
          Gallery 💕
        </motion.h1>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "hsl(340, 50%, 75%)", borderTopColor: "transparent" }}
            />
          </div>
        ) : files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center mt-20 gap-3"
          >
            <span className="text-4xl">📷</span>
            <p className="text-center" style={{ color: "hsl(340, 40%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
              No photos yet. Add some memories!
            </p>
          </motion.div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {files.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                whileTap={{ scale: 1.02 }}
                className="break-inside-avoid rounded-[1.2rem] overflow-hidden cursor-pointer group relative"
                style={{ boxShadow: "0 1px 6px hsl(340 30% 60% / 0.1)" }}
                onClick={() => setSelected(file)}
              >
                {file.isVideo ? (
                  <video src={file.url} className="w-full rounded-[1.2rem]" muted playsInline />
                ) : (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full rounded-[1.2rem]"
                    loading="lazy"
                  />
                )}
                <div
                  className="absolute inset-0 rounded-[1.2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: "hsl(340, 80%, 70% / 0.08)" }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input — accepts photos & videos from phone storage/camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Floating Add button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileTap={{ scale: 0.93 }}
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 right-5 z-30 rounded-full w-14 h-14 flex items-center justify-center shadow-xl"
        style={{
          background: uploading
            ? "hsl(340, 40%, 75%)"
            : "linear-gradient(135deg, hsl(340, 70%, 68%), hsl(350, 65%, 62%))",
          color: "white",
          boxShadow: "0 4px 20px hsl(340 70% 60% / 0.35)",
          pointerEvents: uploading ? "none" : "auto",
        }}
      >
        {uploading ? (
          <div
            className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
          />
        ) : (
          <span className="text-2xl leading-none">+</span>
        )}
      </motion.button>

      {/* Add label below FAB */}
      <div
        className="fixed bottom-[4.5rem] right-5 z-30 text-center"
        style={{ width: "3.5rem" }}
      >
        <span
          className="text-[9px] tracking-wide"
          style={{ color: "hsl(340, 50%, 55%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          {uploading ? "Adding…" : "Add"}
        </span>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(null); }}
              className="absolute top-5 left-5 z-[60] rounded-full w-11 h-11 flex items-center justify-center shadow-sm text-lg font-medium"
              style={{ background: "hsl(340, 60%, 92%)", color: "hsl(340, 40%, 30%)" }}
            >
              ←
            </button>
            {selected.isVideo ? (
              <video
                src={selected.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25 }}
                src={selected.url}
                alt={selected.name}
                className="max-w-full max-h-[85vh] rounded-2xl"
                style={{ boxShadow: "0 4px 20px hsl(0 0% 0% / 0.3)" }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
