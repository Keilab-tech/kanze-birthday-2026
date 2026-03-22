import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
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
  const [files, setFiles]             = useState<MediaFile[]>(STATIC_GALLERY);
  const [loading, setLoading]         = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [confirmUrl, setConfirmUrl]   = useState<string | null>(null); // URL pending delete
  const [deleting, setDeleting]       = useState<string | null>(null); // URL being deleted
  const fileInputRef = useRef<HTMLInputElement>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  /* ── Merge DB files with static, keeping static always present ── */
  const mergeFiles = (dbData: MediaFile[]): MediaFile[] => {
    const merged = [...STATIC_GALLERY];
    dbData.forEach((f) => {
      if (!merged.some((s) => s.url === f.url)) merged.push(f);
    });
    return merged;
  };

  const loadGallery = () => {
    fetch("/api/media/gallery")
      .then((r) => r.json())
      .then((data: MediaFile[]) => setFiles(mergeFiles(data)))
      .catch(() => setFiles(STATIC_GALLERY))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGallery(); }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;
    setUploading(true);
    await Promise.all(
      Array.from(picked).map(async (file) => {
        const form = new FormData();
        form.append("file", file);
        await fetch("/api/media/gallery", { method: "POST", body: form });
      })
    );
    setUploading(false);
    e.target.value = "";
    setLoading(true);
    loadGallery();
  };

  /* ── Delete ────────────────────────────────────────────────────── */
  const handleDeleteTap = (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation();
    setConfirmUrl(file.url);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation();
    setDeleting(file.url);
    setConfirmUrl(null);

    /* Only call API for uploaded (non-static) photos */
    if (file.url.startsWith("/uploads/")) {
      await fetch(`/api/media/${file.id}`, { method: "DELETE" }).catch(() => {});
    }

    /* Close lightbox if this photo was selected */
    setSelectedIdx((prev) => {
      if (prev === null) return null;
      const imgFiles = files.filter((f) => !f.isVideo);
      if (imgFiles[prev]?.url === file.url) return null;
      return prev;
    });

    setFiles((prev) => prev.filter((f) => f.url !== file.url));
    setDeleting(null);
  };

  /* ── Lightbox navigation ─────────────────────────────────────── */
  const imageFiles = files.filter((f) => !f.isVideo);

  const goNext = useCallback(() => {
    setSelectedIdx((i) => (i === null ? null : (i + 1) % imageFiles.length));
  }, [imageFiles.length]);

  const goPrev = useCallback(() => {
    setSelectedIdx((i) =>
      i === null ? null : (i - 1 + imageFiles.length) % imageFiles.length
    );
  }, [imageFiles.length]);

  useEffect(() => {
    if (selectedIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "Escape")     setSelectedIdx(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIdx, goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (Math.abs(dx) < 45) return;
    dx < 0 ? goNext() : goPrev();
  };

  const selected = selectedIdx !== null ? imageFiles[selectedIdx] : null;

  return (
    <div
      className="min-h-screen bg-princess-gradient relative overflow-hidden"
      onClick={() => confirmUrl && setConfirmUrl(null)}
    >
      <PinkParticlesBackground />

      <div className="relative z-10 p-4 pb-28">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          onClick={() => navigate("/hub")}
          className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center shadow-sm"
          style={{ background: "hsl(340, 60%, 92%)", color: "hsl(340, 40%, 35%)" }}
        >←</motion.button>

        <motion.h1
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="text-3xl text-primary text-center mt-14 mb-8"
        >
          Gallery 💕
        </motion.h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "hsl(340, 50%, 75%)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {files.map((file, i) => {
              const isPending = confirmUrl === file.url;
              const isBeingDeleted = deleting === file.url;

              return (
                <motion.div
                  key={file.url}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isBeingDeleted ? 0 : 1, scale: isBeingDeleted ? 0.85 : 1 }}
                  transition={{ duration: isBeingDeleted ? 0.25 : 0.4, delay: isBeingDeleted ? 0 : i * 0.04 }}
                  className="break-inside-avoid rounded-[1.2rem] overflow-hidden cursor-pointer group relative"
                  style={{ boxShadow: "0 1px 6px hsl(340 30% 60% / 0.1)" }}
                  onClick={() => {
                    if (isPending) { setConfirmUrl(null); return; }
                    if (!file.isVideo) {
                      const idx = imageFiles.findIndex((f) => f.url === file.url);
                      setSelectedIdx(idx);
                    }
                  }}
                >
                  {file.isVideo ? (
                    <video src={file.url} className="w-full rounded-[1.2rem]" muted playsInline />
                  ) : (
                    <img src={file.url} alt={file.name} className="w-full rounded-[1.2rem]" loading="lazy" />
                  )}

                  {/* Confirm-delete overlay */}
                  <AnimatePresence>
                    {isPending && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 rounded-[1.2rem] flex flex-col items-center justify-center gap-2"
                        style={{ background: "hsl(0 0% 0% / 0.55)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-white text-xs font-semibold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          Delete photo?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleConfirmDelete(e, file)}
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ background: "hsl(0, 70%, 55%)" }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmUrl(null); }}
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: "hsl(0 0% 100% / 0.2)", color: "white" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Trash icon — always visible */}
                  {!isPending && (
                    <button
                      onClick={(e) => handleDeleteTap(e, file)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-opacity duration-150"
                      style={{ background: "hsl(0 0% 0% / 0.38)", color: "white" }}
                      aria-label="Delete photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />

      {/* Floating Add button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileTap={{ scale: 0.93 }}
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 right-5 z-30 rounded-full w-14 h-14 flex items-center justify-center shadow-xl"
        style={{
          background: uploading ? "hsl(340, 40%, 75%)" : "linear-gradient(135deg, hsl(340, 70%, 68%), hsl(350, 65%, 62%))",
          color: "white",
          boxShadow: "0 4px 20px hsl(340 70% 60% / 0.35)",
          pointerEvents: uploading ? "none" : "auto",
        }}
      >
        {uploading
          ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          : <span className="text-2xl leading-none">+</span>
        }
      </motion.button>

      <div className="fixed bottom-[4.5rem] right-5 z-30 text-center" style={{ width: "3.5rem" }}>
        <span className="text-[9px] tracking-wide" style={{ color: "hsl(340, 50%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
          {uploading ? "Adding…" : "Add"}
        </span>
      </div>

      {/* ── Lightbox with swipe ───────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setSelectedIdx(null)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedIdx(null); }}
              className="absolute top-5 left-5 z-[60] rounded-full w-11 h-11 flex items-center justify-center shadow-sm text-lg font-medium"
              style={{ background: "hsl(340, 60%, 92%)", color: "hsl(340, 40%, 30%)" }}
            >←</button>

            <div className="absolute top-5 right-5 z-[60] px-3 py-1 rounded-full text-xs"
              style={{ background: "hsl(340 60% 92% / 0.9)", color: "hsl(340, 40%, 35%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              {(selectedIdx ?? 0) + 1} / {imageFiles.length}
            </div>

            {imageFiles.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-3 z-[60] rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                style={{ background: "hsl(340 60% 92% / 0.85)", color: "hsl(340, 40%, 30%)" }}
              >‹</button>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={selected.url}
                initial={{ opacity: 0, scale: 0.94, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.94, x: -30 }}
                transition={{ duration: 0.2 }}
                src={selected.url}
                alt={selected.name}
                className="max-w-[92vw] max-h-[82vh] rounded-2xl"
                style={{ boxShadow: "0 4px 32px hsl(0 0% 0% / 0.5)" }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {imageFiles.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-3 z-[60] rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                style={{ background: "hsl(340 60% 92% / 0.85)", color: "hsl(340, 40%, 30%)" }}
              >›</button>
            )}

            <motion.p
              initial={{ opacity: 0.7 }} animate={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="absolute bottom-8 text-xs pointer-events-none"
              style={{ color: "hsl(340 60% 85% / 0.8)", fontFamily: "'Quicksand', sans-serif" }}
            >swipe or use arrows to browse</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
