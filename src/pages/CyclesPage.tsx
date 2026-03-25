import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";
import PeriodTracker from "@/components/PeriodTracker";

const CyclesPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen relative overflow-x-hidden overflow-y-auto"
      style={{
        background:
          "linear-gradient(160deg, hsl(340,90%,96%) 0%, hsl(350,75%,92%) 45%, hsl(20,85%,94%) 100%)",
      }}
    >
      <PinkParticlesBackground />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/hub")}
        data-testid="button-cycles-back"
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center"
        style={{
          background: "hsl(0 0% 100% / 0.65)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            "0 2px 16px hsl(340 50% 70% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
          border: "1px solid hsl(340, 45%, 85%)",
          color: "hsl(340, 65%, 55%)",
        }}
      >
        <ArrowLeft size={17} />
      </motion.button>

      <div className="relative z-10 flex flex-col items-center pt-20 pb-16 px-5">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-7"
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em] mb-1"
            style={{
              color: "hsl(340, 50%, 62%)",
              fontFamily: "'Quicksand', sans-serif",
            }}
          >
            just for you
          </p>
          <h1
            className="text-[2.2rem] leading-tight"
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontWeight: 700,
              background:
                "linear-gradient(135deg, hsl(340,80%,58%) 0%, hsl(350,70%,52%) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Kanze Cycles ✨
          </h1>
        </motion.div>

        {/* Tracker card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="w-full max-w-sm"
        >
          <PeriodTracker />
        </motion.div>
      </div>
    </div>
  );
};

export default CyclesPage;
