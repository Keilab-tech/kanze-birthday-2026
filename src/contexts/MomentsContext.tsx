import { createContext, useContext, useEffect, useState, useCallback } from "react";
import loveEmojiChat from "@/assets/love-emoji-chat.jpeg";

export interface MomentPhoto {
  id: number;
  name: string;
  url: string;
  idb: boolean;
}

/* ── IndexedDB ─────────────────────────────────────────── */
const DB_NAME = "kanze-moments";
const STORE   = "moments";

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

async function idbLoadAll(): Promise<MomentPhoto[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(
        req.result.map((r: { id: number; name: string; blob: Blob }) => ({
          id: r.id, name: r.name,
          url: URL.createObjectURL(r.blob),
          idb: true,
        }))
      );
    req.onerror = () => resolve([]);
  });
}

async function idbSave(file: File): Promise<MomentPhoto> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    const req   = store.add({ name: file.name, blob: file });
    req.onsuccess = () =>
      resolve({ id: req.result as number, name: file.name, url: URL.createObjectURL(file), idb: true });
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => resolve();
  });
}

/* ── Deleted-IDB double-lock ───────────────────────────── */
const LS_DELETED_IDB = "kanze-moments-deleted-idb";

const getDeletedIdb = (): number[] => {
  try { return JSON.parse(localStorage.getItem(LS_DELETED_IDB) ?? "[]"); } catch { return []; }
};
const addDeletedIdb = (id: number) => {
  const list = getDeletedIdb();
  if (!list.includes(id)) localStorage.setItem(LS_DELETED_IDB, JSON.stringify([...list, id]));
};

/* ── Labels in localStorage ────────────────────────────── */
const LS_LABELS  = "kanze-moment-labels";
const LS_HIDDEN  = "kanze-moments-hidden";

const getLabels = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(LS_LABELS) ?? "{}"); } catch { return {}; }
};
const saveLabels = (m: Record<string, string>) =>
  localStorage.setItem(LS_LABELS, JSON.stringify(m));

const getHidden = (): number[] => {
  try { return JSON.parse(localStorage.getItem(LS_HIDDEN) ?? "[]"); } catch { return []; }
};
const saveHidden = (ids: number[]) =>
  localStorage.setItem(LS_HIDDEN, JSON.stringify(ids));

/* ── Hard-coded static moment ──────────────────────────── */
export const STATIC_MOMENT: MomentPhoto = {
  id: -1, name: "love-emoji-chat", url: loveEmojiChat, idb: false,
};
const DEFAULT_LABEL = "First time you sent me a love emoji 😂";

/* ── Context ─────────────────────────────────────────────── */
interface MomentsCtx {
  moments:      MomentPhoto[];
  loading:      boolean;
  labels:       Record<string, string>;
  addMoments:   (files: File[]) => Promise<void>;
  deleteMoment: (moment: MomentPhoto) => Promise<void>;
  setLabel:     (id: number, text: string) => void;
}

const Ctx = createContext<MomentsCtx>({
  moments: [], loading: true, labels: {},
  addMoments: async () => {}, deleteMoment: async () => {}, setLabel: () => {},
});

export const useMoments = () => useContext(Ctx);

export function MomentsProvider({ children }: { children: React.ReactNode }) {
  const [moments, setMoments] = useState<MomentPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [labels,  setLabels]  = useState<Record<string, string>>({});

  useEffect(() => {
    const hidden     = getHidden();
    const deletedIdb = getDeletedIdb();
    const stored     = getLabels();
    if (!stored["-1"]) stored["-1"] = DEFAULT_LABEL;
    setLabels(stored);
    idbLoadAll()
      .then((idb) => {
        const base = hidden.includes(-1) ? [] : [STATIC_MOMENT];
        setMoments([...base, ...idb.filter((m) => !deletedIdb.includes(m.id))]);
      })
      .catch(() => {
        const base = hidden.includes(-1) ? [] : [STATIC_MOMENT];
        setMoments(base);
      })
      .finally(() => setLoading(false));
  }, []);

  const addMoments = useCallback(async (files: File[]) => {
    const saved: MomentPhoto[] = [];
    for (const file of files) {
      try { saved.push(await idbSave(file)); } catch { /* skip */ }
    }
    if (saved.length) setMoments((prev) => [...prev, ...saved]);
  }, []);

  const deleteMoment = useCallback(async (moment: MomentPhoto) => {
    if (moment.idb) {
      /* Mark deleted in localStorage FIRST — moment won't reappear even if IDB fails */
      addDeletedIdb(moment.id);
      setMoments((prev) => prev.filter((m) => m.id !== moment.id));
      URL.revokeObjectURL(moment.url);
      idbDelete(moment.id).catch(() => {});
    } else {
      const h = getHidden();
      if (!h.includes(moment.id)) saveHidden([...h, moment.id]);
      setMoments((prev) => prev.filter((m) => m.id !== moment.id));
    }
  }, []);

  const setLabel = useCallback((id: number, text: string) => {
    setLabels((prev) => {
      const next = { ...prev, [String(id)]: text };
      saveLabels(next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ moments, loading, labels, addMoments, deleteMoment, setLabel }}>
      {children}
    </Ctx.Provider>
  );
}
