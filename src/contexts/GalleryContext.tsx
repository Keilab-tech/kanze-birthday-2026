import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface GalleryPhoto {
  id: number;       // negative = static, positive = IDB
  name: string;
  url: string;
  isVideo: boolean;
  idb: boolean;
}

/* ── IndexedDB helpers ─────────────────────────────────── */
const DB_NAME = "kanze-gallery";
const STORE   = "photos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE))
        req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbLoadAll(): Promise<GalleryPhoto[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(
        req.result.map((r: { id: number; name: string; blob: Blob; mime: string }) => ({
          id: r.id, name: r.name,
          url: URL.createObjectURL(r.blob),
          isVideo: r.mime.startsWith("video/"),
          idb: true,
        }))
      );
    req.onerror = () => resolve([]);
  });
}

async function idbSave(file: File): Promise<GalleryPhoto> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    const req   = store.add({ name: file.name, blob: file, mime: file.type });
    req.onsuccess = () =>
      resolve({ id: req.result as number, name: file.name,
        url: URL.createObjectURL(file), isVideo: file.type.startsWith("video/"), idb: true });
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => resolve(); /* always resolve so caller can proceed */
  });
}

/* ── Deleted-IDB tracking (double-lock so photos never reappear) ─── */
const LS_DELETED_IDB = "kanze-gallery-deleted-idb";

const getDeletedIdb = (): number[] => {
  try { return JSON.parse(localStorage.getItem(LS_DELETED_IDB) ?? "[]"); } catch { return []; }
};
const addDeletedIdb = (id: number) => {
  const list = getDeletedIdb();
  if (!list.includes(id)) localStorage.setItem(LS_DELETED_IDB, JSON.stringify([...list, id]));
};

/* ── Hidden-static tracking in localStorage ─────────────── */
const LS_HIDDEN = "kanze-gallery-hidden";

const getHidden = (): number[] => {
  try { return JSON.parse(localStorage.getItem(LS_HIDDEN) ?? "[]"); } catch { return []; }
};
const setHidden = (ids: number[]) =>
  localStorage.setItem(LS_HIDDEN, JSON.stringify(ids));

/* ── Static photos ──────────────────────────────────────── */
export const STATIC_PHOTOS: GalleryPhoto[] = [
  { id: -1,  name: "photo1.jpeg",  url: "/images/gallery/photo1.jpeg",  isVideo: false, idb: false },
  { id: -2,  name: "photo2.jpeg",  url: "/images/gallery/photo2.jpeg",  isVideo: false, idb: false },
  { id: -3,  name: "photo3.jpeg",  url: "/images/gallery/photo3.jpeg",  isVideo: false, idb: false },
  { id: -4,  name: "photo4.jpeg",  url: "/images/gallery/photo4.jpeg",  isVideo: false, idb: false },
  { id: -5,  name: "photo5.jpeg",  url: "/images/gallery/photo5.jpeg",  isVideo: false, idb: false },
  { id: -6,  name: "photo6.jpeg",  url: "/images/gallery/photo6.jpeg",  isVideo: false, idb: false },
  { id: -7,  name: "photo7.jpeg",  url: "/images/gallery/photo7.jpeg",  isVideo: false, idb: false },
  { id: -8,  name: "photo8.jpeg",  url: "/images/gallery/photo8.jpeg",  isVideo: false, idb: false },
  { id: -9,  name: "photo9.jpeg",  url: "/images/gallery/photo9.jpeg",  isVideo: false, idb: false },
  { id: -10, name: "photo10.jpeg", url: "/images/gallery/photo10.jpeg", isVideo: false, idb: false },
  { id: -11, name: "photo11.jpeg", url: "/images/gallery/photo11.jpeg", isVideo: false, idb: false },
];

/* ── Context ─────────────────────────────────────────────── */
interface GalleryCtx {
  photos:       GalleryPhoto[];
  loading:      boolean;
  addPhotos:    (files: File[]) => Promise<void>;
  deletePhoto:  (photo: GalleryPhoto) => Promise<void>;
}

const Ctx = createContext<GalleryCtx>({
  photos: [], loading: true,
  addPhotos: async () => {}, deletePhoto: async () => {},
});

export const useGallery = () => useContext(Ctx);

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos]   = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hidden     = getHidden();
    const deletedIdb = getDeletedIdb();
    const visible    = STATIC_PHOTOS.filter((p) => !hidden.includes(p.id));
    idbLoadAll()
      .then((idb) => setPhotos([...visible, ...idb.filter((p) => !deletedIdb.includes(p.id))]))
      .catch(() => setPhotos(visible))
      .finally(() => setLoading(false));
  }, []);

  const addPhotos = useCallback(async (files: File[]) => {
    const saved: GalleryPhoto[] = [];
    for (const file of files) {
      try { saved.push(await idbSave(file)); } catch { /* skip */ }
    }
    if (saved.length) setPhotos((prev) => [...prev, ...saved]);
  }, []);

  const deletePhoto = useCallback(async (photo: GalleryPhoto) => {
    if (photo.idb) {
      /* Mark as deleted in localStorage FIRST — photo won't reappear even if IDB fails */
      addDeletedIdb(photo.id);
      /* Remove from React state immediately */
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      /* Clean up memory + IDB in background */
      URL.revokeObjectURL(photo.url);
      idbDelete(photo.id).catch(() => {});
    } else {
      /* Static photo — add to hidden list before removing from state */
      const h = getHidden();
      if (!h.includes(photo.id)) setHidden([...h, photo.id]);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    }
  }, []);

  return (
    <Ctx.Provider value={{ photos, loading, addPhotos, deletePhoto }}>
      {children}
    </Ctx.Provider>
  );
}
