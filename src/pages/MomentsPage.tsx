import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";
import loveEmojiChat from "@/assets/love-emoji-chat.jpeg";

interface MomentFile {
  id: number;
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
  const [selected, setSelected] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    fetch("/api/media/moments")
      .then((r) => r.json())
      .then((data: MomentFile[]) => setFiles(data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
          Moments 📸
        </motion.h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {files.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileTap={{ scale: 1.02 }}
                className="break-inside-avoid rounded-[1.2rem] overflow-hidden cursor-pointer group relative"
                style={{ boxShadow: "0 1px 6px hsl(340 30% 60% / 0.1)" }}
                onClick={() => setSelected(file)}
              >
                <img src={file.url} alt={file.name} className="w-full rounded-[1.2rem]" loading="lazy" />
                <div
                  className="absolute bottom-0 left-0 right-0 p-3 rounded-b-[1.2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(transparent, hsl(340, 50%, 65%, 0.6))" }}
                >
                  <p className="text-white text-xs text-center" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    {captions[i % captions.length]}
                  </p>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: files.length * 0.06 }}
              whileTap={{ scale: 1.02 }}
              className="break-inside-avoid rounded-[1.2rem] overflow-hidden cursor-pointer relative"
              style={{ boxShadow: "0 1px 6px hsl(340 30% 60% / 0.1)" }}
              onClick={() => setSelected({ name: "love-emoji-chat", url: loveEmojiChat })}
            >
              <img src={loveEmojiChat} alt="First love emoji chat" className="w-full rounded-[1.2rem]" loading="lazy" />
              <div
                className="absolute bottom-0 left-0 right-0 p-3 rounded-b-[1.2rem]"
                style={{ background: "linear-gradient(transparent, hsl(340, 50%, 65%, 0.6))" }}
              >
                <p className="text-white text-xs text-center" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  First time you sent me a love emoji 😂
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            src={selected.url}
            alt={selected.name}
            className="max-w-full max-h-[85vh] rounded-2xl"
            style={{ boxShadow: "0 4px 20px hsl(0 0% 0% / 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
};

export default MomentsPage;
