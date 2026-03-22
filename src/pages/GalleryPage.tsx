import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";

interface MediaFile {
  id: number;
  name: string;
  url: string;       // object URL for IDB photos, or /images/... for static
  isVideo: boolean;
  idb?: boolean;     // true = stored in IndexedDB (can be deleted from IDB)
}

/* ─── IndexedDB helpers ─────────────────────────────────────────── */
const DB_NAME  = "kanze-gallery";
const DB_VER   = 1;
const STORE    = "photos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbLoadAll(): Promise<MediaFile[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => {
      const items: MediaFile[] = req.result.map((row: { id: number; name: string; blob: Blob; mime: string }) => ({
        id:      row.id,
        name:    row.name,
        url:     URL.createObjectURL(row.blob),
        isVideo: row.mime.startsWith("video/"),
        idb:     true,
      }));
      resolve(items);
    };
    req.onerror = () => resolve([]);
  });
}

async function idbSave(file: File): Promise<MediaFile> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const row   = { name: file.name, blob: file, mime: file.type };
    const req   = store.add(row);
    req.onsuccess = () => {
      const id = req.result as number;
      resolve({
        id,
        name:    file.name,
        url:     URL.createObjectURL(file),
        isVideo: file.type.startsWith("video/"),
        idb:     true,
      });
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
  });
}

/* ─── Static photos (always shown) ─────────────────────────────── */
const STATIC_GALLERY: MediaFile[] = [
  { id: -1, name: "photo1.jpeg", url: "/images/gallery/photo1.jpeg", isVideo: false },
  { id: -2, name: "photo2.jpeg", url: "/images/gallery/photo2.jpeg", isVideo: false },
  { id: -3, name: "photo3.jpeg", url: "/images/gallery/photo3.jpeg", isVideo: false },
  { id: -4, name: "photo4.jpeg", url: "/images/gallery/photo4.jpeg", isVideo: false },
  { id: -5, name: "photo5.jpeg", url: "/images/gallery/photo5.jpeg", isVideo: false },
];

/* ─── Component ─────────────────────────────────────────────────── */
const GalleryPage = () => {
  const navigate = useNavigate();
  const [files, setFiles]             = useState<MediaFile[]>(STATIC_GALLERY);
  const [loading, setLoading]         = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [confirmId, setConfirmId]     = useState<number | null>(null);
  const [deleting, setDeleting]       = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  /* ── Load static + IDB photos on mount ── */
  useEffect(() => {
    idbLoadAll()
      .then((idbFiles) => setFiles([...STATIC_GALLERY, ...idbFiles]))
      .catch(() => setFiles(STATIC_GALLERY))
      .finally(() => setLoading(false));
  }, []);

  /* ── Add photos ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;
    setUploading(true);
    const saved: MediaFile[] = [];
    for (const file of Array.from(picked)) {
      try {
        const m = await idbSave(file);
        saved.push(m);
      } catch { /* skip if fails */ }
    }
    setFiles((prev) => [...prev, ...saved]);
    setUploading(false);
    e.target.value = "";
  };

  /* ── Delete ── */
  const handleConfirmDelete = async (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation();
    setConfirmId(null);
    setDeleting(file.id);

    if (file.idb) {
      await idbDelete(file.id).catch(() => {});
      /* Revoke the object URL to free memory */
      URL.revokeObjectURL(file.url);
    }

    setSelectedIdx((prev) => {
      if (prev === null) return null;
      const imgs = files.filter((f) => !f.isVideo);
      if (imgs[prev]?.id === file.id) return null;
      return prev;
    });

    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    setDeleting(null);
  };

  /* ── Lightbox navigation ── */
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
    if (Math.abs(dx) < Math.abs(dy) * 1.2 || Math.abs(dx) < 45) return;
    dx < 0 ? goNext() : goPrev();
  };

  const selected = selectedIdx !== null ? imageFiles[selectedIdx] : null;

  return (
    <div
      className="min-h-screen bg-princess-gradient relative overflow-hidden"
      onClick={() => confirmId !== null && setConfirmId(null)}
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
              const isPending     = confirmId === file.id;
              const isBeingDeleted = deleting === file.id;

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isBeingDeleted ? 0 : 1, scale: isBeingDeleted ? 0.85 : 1 }}
                  transition={{ duration: isBeingDeleted ? 0.25 : 0.4, delay: isBeingDeleted ? 0 : i * 0.04 }}
                  className="break-inside-avoid rounded-[1.2rem] overflow-hidden cursor-pointer group relative"
                  style={{ boxShadow: "0 1px 6px hsl(340 30% 60% / 0.1)" }}
                  onClick={() => {
                    if (isPending) { setConfirmId(null); return; }
                    if (!file.isVideo) {
                      setSelectedIdx(imageFiles.findIndex((f) => f.id === file.id));
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
                          >Delete</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: "hsl(0 0% 100% / 0.2)", color: "white" }}
                          >Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Trash icon — only on user-added photos */}
                  {!isPending && file.idb && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId(file.id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
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

      {/* File input — sr-only keeps it accessible without display:none */}
      <input
        ref={fileInputRef}
        id="gallery-upload"
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Floating Add button */}
      <motion.label
        htmlFor={uploading ? undefined : "gallery-upload"}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-6 right-5 z-30 rounded-full w-14 h-14 flex items-center justify-center shadow-xl cursor-pointer"
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
      </motion.label>

      <div className="fixed bottom-[4.5rem] right-5 z-30 text-center" style={{ width: "3.5rem" }}>
        <span className="text-[9px] tracking-wide" style={{ color: "hsl(340, 50%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
          {uploading ? "Adding…" : "Add"}
        </span>
      </div>

      {/* ── Lightbox ── */}
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
