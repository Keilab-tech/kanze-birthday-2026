import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PinkParticlesBackground from "./PinkParticlesBackground";
import MusicPlayerBar from "./MusicToggle";
import BirthdayCountdown from "./BirthdayCountdown";
import PhotoSlider from "./PhotoSlider";

const glowButtonStyle = {
  background: "linear-gradient(135deg, hsl(340, 80%, 70%), hsl(350, 75%, 65%))",
  color: "white",
  boxShadow:
    "0 0 15px hsl(340 80% 60% / 0.5), 0 0 30px hsl(280 60% 60% / 0.25), 0 6px 25px hsl(340 80% 60% / 0.35)",
};

const MemoryHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-hidden">
      <PinkParticlesBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Photo Slider */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-sm mb-8"
        >
          <PhotoSlider />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-4xl md:text-5xl text-primary mb-16"
        >
          Your Memories
        </motion.h1>

        <div className="flex flex-row gap-4 w-full max-w-xs justify-center">
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px hsl(340 80% 60% / 0.7), 0 0 50px hsl(280 60% 60% / 0.35)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/gallery")}
            className="rounded-full py-3 px-8 text-sm font-medium"
            style={glowButtonStyle}
          >
            Gallery
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px hsl(340 80% 60% / 0.7), 0 0 50px hsl(280 60% 60% / 0.35)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/moments")}
            className="rounded-full py-3 px-8 text-sm font-medium"
            style={glowButtonStyle}
          >
            Moments
          </motion.button>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 25px hsl(340 80% 60% / 0.7), 0 0 50px hsl(280 60% 60% / 0.35)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/letter")}
          className="mt-6 rounded-full py-3 px-8 text-sm font-medium"
          style={glowButtonStyle}
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
