import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";

interface MediaFile {
  name: string;
  url: string;
  isVideo: boolean;
}

const GalleryPage = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MediaFile | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      const { data, error } = await supabase.storage
        .from("kanze-birthday")
        .list("gallery", { limit: 100, sortBy: { column: "name", order: "asc" } });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const mediaFiles: MediaFile[] = data
        .filter(f => f.name !== ".emptyFolderPlaceholder")
        .map(f => {
          const { data: urlData } = supabase.storage
            .from("kanze-birthday")
            .getPublicUrl(`gallery/${f.name}`);
          const ext = f.name.split(".").pop()?.toLowerCase() || "";
          return {
            name: f.name,
            url: urlData.publicUrl,
            isVideo: ["mp4", "webm", "mov"].includes(ext),
          };
        });

      setFiles(mediaFiles);
      setLoading(false);
    };
    loadFiles();
  }, []);

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-hidden">
      <PinkParticlesBackground />

      <div className="relative z-10 p-4 pb-20">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate("/hub")}
          className="fixed top-4 left-4 z-30 rounded-full w-10 h-10 flex items-center justify-center shadow-md"
          style={{
            background: "hsl(340, 60%, 90%)",
            color: "hsl(340, 40%, 35%)",
          }}
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

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground mt-20"
          >
            No photos yet. Upload images to the{" "}
            <span className="font-medium text-primary">gallery</span> folder in storage.
          </motion.p>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {files.map((file, i) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="break-inside-avoid rounded-2xl overflow-hidden shadow-md cursor-pointer group relative"
                onClick={() => setSelected(file)}
              >
                {file.isVideo ? (
                  <video src={file.url} className="w-full rounded-2xl" muted playsInline />
                ) : (
                  <img src={file.url} alt={file.name} className="w-full rounded-2xl" loading="lazy" />
                )}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "hsl(340, 80%, 70%, 0.15)" }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          {/* Close / Back button */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(null); }}
            className="absolute top-5 left-5 z-60 rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
            style={{
              background: "hsl(340, 60%, 90%)",
              color: "hsl(340, 40%, 35%)",
            }}
          >
            ←
          </button>
          {selected.isVideo ? (
            <video src={selected.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl" onClick={e => e.stopPropagation()} />
          ) : (
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={selected.url}
              alt={selected.name}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default GalleryPage;
