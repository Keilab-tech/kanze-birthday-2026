import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home, Images, BookOpen, Mail } from "lucide-react";
import PinkParticlesBackground from "./PinkParticlesBackground";
import MusicPlayerBar from "./MusicToggle";
import BirthdayCountdown from "./BirthdayCountdown";
import PhotoSlider from "./PhotoSlider";
import PeriodTrackerSheet from "./PeriodTrackerSheet";
import { isBirthdayToday, isBirthdayOver } from "@/utils/birthday";

const IS_BIRTHDAY = isBirthdayToday();
const IS_OVER     = isBirthdayOver();

const NAV_CARDS = [
  {
    label: "Gallery",
    sublabel: "My photos",
    icon: Images,
    path: "/gallery",
    delay: 0.55,
    accent: "hsl(340, 70%, 72%)",
    glow: "hsl(340 60% 70% / 0.22)",
    hideText: false,
  },
  {
    label: "Moments",
    sublabel: "Moments",
    icon: BookOpen,
    path: "/moments",
    delay: 0.65,
    accent: "hsl(350, 65%, 68%)",
    glow: "hsl(350 55% 68% / 0.22)",
    hideText: false,
  },
  {
    label: "A Letter",
    sublabel: "",
    icon: Mail,
    path: "/letter",
    delay: 0.75,
    accent: "hsl(330, 68%, 65%)",
    glow: "hsl(330 58% 65% / 0.22)",
    hideText: true,
  },
];

const MemoryHub = () => {
  const navigate = useNavigate();
  const [showWaitModal, setShowWaitModal] = useState(false);

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto"
      style={{
        background: "linear-gradient(160deg, hsl(340,90%,96%) 0%, hsl(350,75%,92%) 45%, hsl(20,85%,94%) 100%)",
      }}
    >
      <PinkParticlesBackground />

      {/* Home button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => IS_OVER ? setShowWaitModal(true) : navigate("/")}
        data-testid="button-home"
        title={IS_OVER ? "Blow the candle" : "Back to cake"}
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center"
        style={{
          background: "hsl(0 0% 100% / 0.65)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 2px 16px hsl(340 50% 70% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
          border: "1px solid hsl(340, 45%, 85%)",
          color: "hsl(340, 65%, 55%)",
        }}
      >
        <Home size={17} />
      </motion.button>

      {/* "Wait till next birthday" modal — shown after birthday is over */}
      <AnimatePresence>
        {showWaitModal && (
          <motion.div
            key="wait-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "hsl(340 30% 10% / 0.55)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowWaitModal(false)}
          >
            <motion.div
              key="wait-modal-card"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[22rem] rounded-3xl p-8 flex flex-col items-center gap-5 text-center"
              style={{
                background: "linear-gradient(160deg, hsl(340,90%,97%) 0%, hsl(350,80%,94%) 100%)",
                boxShadow: "0 24px 64px hsl(340 60% 50% / 0.22), 0 4px 16px hsl(340 40% 60% / 0.15)",
                border: "1px solid hsl(340, 60%, 88%)",
              }}
            >
              {/* Candle emoji with glow */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl"
                style={{ filter: "drop-shadow(0 0 12px hsl(40 90% 70% / 0.7))" }}
              >
                🕯️
              </motion.div>

              <div className="flex flex-col gap-2">
                <p
                  className="text-lg leading-snug"
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontWeight: 700,
                    fontSize: "1.45rem",
                    color: "hsl(340, 55%, 38%)",
                  }}
                >
                  Wait till your next birthday to blow the candle
                </p>
                <p className="text-2xl">habibi 🥰❤️</p>
              </div>

              <button
                onClick={() => setShowWaitModal(false)}
                className="mt-1 rounded-full px-8 py-3 text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, hsl(340,75%,65%), hsl(350,70%,60%))",
                  color: "white",
                  fontFamily: "'Quicksand', sans-serif",
                  boxShadow: "0 4px 18px hsl(340 70% 60% / 0.32)",
                }}
              >
                Back to dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center pb-20">

        {/* ── Photo Slider ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="w-full relative"
          style={{ height: "46vh" }}
        >
          <PhotoSlider />
          {/* bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: "linear-gradient(to top, hsl(340,90%,96%), transparent)",
            }}
          />
        </motion.div>

        {/* ── Birthday greeting — visible on March 21 only ── */}
        {IS_BIRTHDAY && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="text-center px-6 mt-1 mb-7"
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.22em] mb-1"
              style={{ color: "hsl(340, 50%, 62%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              celebrating you
            </p>
            <h1
              className="text-[2.6rem] leading-tight"
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontWeight: 700,
                background: "linear-gradient(135deg, hsl(340,80%,58%) 0%, hsl(350,70%,52%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Happy Birthday,
            </h1>
            <h1
              className="text-[3rem] leading-tight -mt-1"
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontWeight: 700,
                background: "linear-gradient(135deg, hsl(350,75%,55%) 0%, hsl(10,70%,58%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Kanze ✨
            </h1>
          </motion.div>
        )}

        {/* ── Nav Cards ── */}
        <div className="w-full max-w-sm px-5 grid grid-cols-2 gap-3">
          {NAV_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const isLastOdd = NAV_CARDS.length % 2 !== 0 && idx === NAV_CARDS.length - 1;
            return (
              <motion.button
                key={card.path}
                initial={{ opacity: 0, y: 22, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(card.path)}
                data-testid={`button-nav-${card.label.toLowerCase()}`}
                className={`relative flex flex-col items-start gap-2 rounded-2xl p-4 text-left overflow-hidden${isLastOdd ? " col-span-2 max-w-[50%] mx-auto w-full" : ""}`}
                style={{
                  background: "hsl(0 0% 100% / 0.52)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid hsl(0 0% 100% / 0.75)",
                  boxShadow: `0 4px 20px ${card.glow}, inset 0 1px 0 hsl(0 0% 100% / 0.9)`,
                }}
              >
                {/* icon bubble */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${card.accent} 0%, ${card.accent.replace(")", ", 0.75)").replace("hsl", "hsla")} 100%)`,
                    boxShadow: `0 3px 10px ${card.glow}`,
                  }}
                >
                  <Icon size={17} color="white" strokeWidth={2} />
                </div>
                {!card.hideText && (
                  <div>
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: "hsl(340, 40%, 30%)", fontFamily: "'Quicksand', sans-serif" }}
                    >
                      {card.label}
                    </p>
                    {card.sublabel && (
                      <p
                        className="text-[11px] leading-tight mt-0.5"
                        style={{ color: "hsl(340, 30%, 55%)", fontFamily: "'Quicksand', sans-serif" }}
                      >
                        {card.sublabel}
                      </p>
                    )}
                  </div>
                )}
                {/* subtle shimmer corner */}
                <div
                  className="absolute top-0 right-0 w-14 h-14 rounded-bl-full opacity-20 pointer-events-none"
                  style={{ background: card.accent }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.5 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="w-24 h-px mt-8 mb-6 rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, hsl(340,60%,75%), transparent)" }}
        />

        {/* ── Music Player ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.05 }}
          className="w-full max-w-sm px-5"
        >
          <MusicPlayerBar />
        </motion.div>

        {/* ── Countdown ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="mt-6 w-full max-w-sm px-5"
        >
          <BirthdayCountdown />
        </motion.div>


      </div>

      {/* ── Hidden period tracker — opened via floating edge button ── */}
      <PeriodTrackerSheet />
    </div>
  );
};

export default MemoryHub;
