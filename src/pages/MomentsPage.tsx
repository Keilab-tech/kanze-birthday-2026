import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";

interface MomentFile {
  name: string;
  url: string;
}

const captions = [
  "Remember this?",
  "You couldn't stop laughing here.",
  "This was everything.",
  "A moment frozen in time.",
  "The best kind of trouble.",
  "Pure happiness.",
  "We didn't need a reason to smile.",
  "Some things never change.",
];

const MomentsPage = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<MomentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MomentFile | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      const { data, error } = await supabase.storage
        .from("kanze-birthday")
        .list("moments", { limit: 100, sortBy: { column: "name", order: "asc" } });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const momentFiles: MomentFile[] = data
        .filter(f => f.name !== ".emptyFolderPlaceholder")
        .map(f => {
          const { data: urlData } = supabase.storage
            .from("kanze-birthday")
            .getPublicUrl(`moments/${f.name}`);
          return { name: f.name, url: urlData.publicUrl };
        });

      setFiles(momentFiles);
      setLoading(false);
    };
    loadFiles();
  }, []);

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-hidden">
      <PinkParticlesBackground />

      <div className="relative z-10 p-4 pb-20">
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
          Moments 📸
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
            No moments yet. Upload screenshots to the{" "}
            <span className="font-medium text-primary">moments</span> folder in storage.
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
                <img src={file.url} alt={file.name} className="w-full rounded-2xl" loading="lazy" />
                {/* Caption overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-3 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(transparent, hsl(340, 60%, 70%, 0.8))",
                  }}
                >
                  <p className="text-white text-xs text-center" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    {captions[i % captions.length]}
                  </p>
                </div>
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
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            src={selected.url}
            alt={selected.name}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
          />
        </motion.div>
      )}
    </div>
  );
};

export default MomentsPage;
