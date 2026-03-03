import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import PinkParticlesBackground from "./PinkParticlesBackground";
import MusicPlayerBar from "./MusicToggle";
import BirthdayCountdown from "./BirthdayCountdown";
import PhotoSlider from "./PhotoSlider";

const softButtonStyle = {
  background: "hsl(340, 55%, 75%)",
  color: "white",
  boxShadow: "0 2px 8px hsl(340 40% 60% / 0.2)",
};

const MemoryHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-x-hidden overflow-y-auto">
      <PinkParticlesBackground />

      <div className="relative z-10 flex flex-col items-center px-6 pb-16">
        {/* Photo Slider — fills top half */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full"
          style={{ height: "50vh" }}
        >
          <PhotoSlider />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="my-3"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={22} style={{ color: "hsl(340, 60%, 65%)" }} />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-4xl md:text-5xl text-primary mt-6 mb-10"
        >
          Your Memories
        </motion.h1>

        <div className="flex flex-row gap-4 w-full max-w-xs justify-center">
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/gallery")}
            className="rounded-full py-3 px-8 text-sm font-medium transition-shadow"
            style={softButtonStyle}
          >
            Gallery
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/moments")}
            className="rounded-full py-3 px-8 text-sm font-medium transition-shadow"
            style={softButtonStyle}
          >
            Moments
          </motion.button>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/letter")}
          className="mt-6 rounded-full py-3 px-8 text-sm font-medium transition-shadow"
          style={softButtonStyle}
        >
          Click Me 💌
        </motion.button>

        {/* Inline music player */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-8 w-full flex justify-center"
        >
          <MusicPlayerBar />
        </motion.div>

        {/* Birthday countdown */}
        <div className="mt-8">
          <BirthdayCountdown />
        </div>
      </div>
    </div>
  );
};

export default MemoryHub;
