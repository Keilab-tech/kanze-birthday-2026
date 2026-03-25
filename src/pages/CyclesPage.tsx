import { Component } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";
import PeriodTracker from "@/components/PeriodTracker";

class TrackerErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "hsl(0 0% 100% / 0.72)", border: "1px solid hsl(340, 35%, 90%)" }}
        >
          <p className="text-2xl mb-2">🌸</p>
          <p className="text-sm font-semibold" style={{ color: "hsl(340, 40%, 40%)", fontFamily: "'Quicksand', sans-serif" }}>
            Something went wrong loading the tracker.
          </p>
          <p className="text-xs mt-1" style={{ color: "hsl(340, 30%, 58%)", fontFamily: "'Quicksand', sans-serif" }}>
            {this.state.message}
          </p>
          <button
            onClick={() => {
              ["kanze-period-setup-done", "kanze-period-logs", "kanze-cycle-length", "kanze-period-length"].forEach(
                (k) => localStorage.removeItem(k)
              );
              this.setState({ hasError: false, message: "" });
            }}
            className="mt-4 px-4 py-2 rounded-full text-xs font-bold"
            style={{ background: "hsl(340,70%,62%)", color: "white", fontFamily: "'Quicksand', sans-serif" }}
          >
            Reset &amp; Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        {/* Round cat logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.18, type: "spring", stiffness: 220, damping: 16 }}
          className="mb-4"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid hsl(340, 65%, 80%)",
            boxShadow: "0 4px 20px hsl(340 60% 65% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
          }}
        >
          <img
            src="/images/cat-logo.jpeg"
            alt="Kanze Cycles"
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
          />
        </motion.div>

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
          <TrackerErrorBoundary>
            <PeriodTracker />
          </TrackerErrorBoundary>
        </motion.div>
      </div>
    </div>
  );
};

export default CyclesPage;
