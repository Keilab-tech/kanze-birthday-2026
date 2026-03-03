import { motion } from "framer-motion";
import { useMusic } from "@/contexts/MusicContext";

const MusicToggle = () => {
  const { toggle, isPlaying } = useMusic();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      onClick={toggle}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-3 py-2 shadow-xl"
      style={{
        background: "linear-gradient(135deg, hsl(220, 10%, 25%), hsl(220, 10%, 18%))",
        border: "1px solid hsl(220, 8%, 35%)",
      }}
      aria-label={isPlaying ? "Pause music" : "Play music"}
    >
      {/* Vinyl disc */}
      <motion.div
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, hsl(0,0%,30%) 18%, hsl(0,0%,12%) 20%, hsl(0,0%,18%) 45%, hsl(0,0%,12%) 47%, hsl(0,0%,20%) 70%, hsl(0,0%,15%) 100%)",
          border: "2px solid hsl(0, 0%, 40%)",
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "hsl(0, 0%, 55%)" }}
        />
      </motion.div>

      {/* Sound bars */}
      <div className="flex items-center gap-[2px] h-5">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{ background: "hsl(0, 0%, 60%)" }}
            animate={
              isPlaying
                ? {
                    height: [4, 8 + Math.random() * 10, 4, 12 + Math.random() * 6, 4],
                  }
                : { height: 4 }
            }
            transition={
              isPlaying
                ? {
                    duration: 0.8 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }
                : { duration: 0.3 }
            }
          />
        ))}
      </div>

      {/* MUSIC label */}
      <span
        className="text-[10px] font-semibold tracking-wider pr-1"
        style={{ color: "hsl(0, 0%, 70%)" }}
      >
        {isPlaying ? "♪" : "▶"}
      </span>
    </motion.button>
  );
};

export default MusicToggle;
