import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PinkParticlesBackground from "./PinkParticlesBackground";

const MemoryHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-hidden">
      <PinkParticlesBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-4xl md:text-5xl text-primary mb-16"
        >
          Your Memories
        </motion.h1>

        <div className="flex flex-col gap-6 w-full max-w-xs">
          {/* Gallery Card */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/gallery")}
            className="rounded-3xl py-8 px-6 text-center shadow-lg border border-border/50"
            style={{
              background: "linear-gradient(135deg, hsl(340, 70%, 92%), hsl(350, 60%, 88%), hsl(20, 70%, 92%))",
              boxShadow: "0 8px 30px hsl(340 60% 70% / 0.2)",
            }}
          >
            <span className="text-3xl mb-2 block">💕</span>
            <span className="text-xl font-medium text-foreground">Gallery</span>
          </motion.button>

          {/* Moments Card */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/moments")}
            className="rounded-3xl py-8 px-6 text-center shadow-lg border border-border/50"
            style={{
              background: "linear-gradient(135deg, hsl(350, 60%, 90%), hsl(340, 70%, 88%), hsl(330, 60%, 92%))",
              boxShadow: "0 8px 30px hsl(340 60% 70% / 0.2)",
            }}
          >
            <span className="text-3xl mb-2 block">📸</span>
            <span className="text-xl font-medium text-foreground">Moments</span>
          </motion.button>
        </div>

        {/* Letter Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/letter")}
          className="mt-16 rounded-full py-4 px-10 text-lg font-medium shadow-xl"
          style={{
            background: "linear-gradient(135deg, hsl(340, 80%, 70%), hsl(350, 75%, 65%))",
            color: "white",
            boxShadow: "0 6px 25px hsl(340 80% 60% / 0.35)",
          }}
        >
          Click Me 💌
        </motion.button>
      </div>
    </div>
  );
};

export default MemoryHub;
