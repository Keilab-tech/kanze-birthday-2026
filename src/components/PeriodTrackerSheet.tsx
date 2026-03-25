import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import PeriodTracker from "./PeriodTracker";

/* Hidden floating trigger + full slide-up sheet for the Period Tracker.
   The trigger is a small, discreet button at the bottom-right edge.
   Nothing on the main dashboard hints at what it does. */

const PeriodTrackerSheet = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Floating trigger ── */}
      <motion.button
        data-testid="button-period-tracker-open"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.5, type: "spring", stiffness: 180 }}
        whileTap={{ scale: 0.88 }}
        title=" "
        style={{
          position: "fixed",
          bottom: 72,
          right: 0,
          zIndex: 40,
          /* half-pill shape flush with the right edge */
          width: 36,
          height: 36,
          borderRadius: "50% 0 0 50%",
          background: "hsl(350 65% 52% / 0.82)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid hsl(350 50% 60% / 0.5)",
          borderRight: "none",
          boxShadow: "-2px 3px 14px hsl(350 60% 45% / 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          /* nudge icon left slightly so it sits inside the pill */
          paddingRight: 2,
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1, userSelect: "none" }}>🩸</span>
      </motion.button>

      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="pt-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "hsl(340 30% 10% / 0.45)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Slide-up sheet ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="pt-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 51,
              maxHeight: "90dvh",
              borderRadius: "22px 22px 0 0",
              background: "linear-gradient(160deg, hsl(340,90%,97%) 0%, hsl(350,75%,94%) 60%, hsl(20,85%,96%) 100%)",
              boxShadow: "0 -8px 40px hsl(340 50% 50% / 0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* drag handle + close */}
            <div
              className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0"
            >
              {/* drag pill */}
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                style={{ background: "hsl(340, 40%, 82%)" }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: "hsl(340, 45%, 40%)", fontFamily: "'Quicksand', sans-serif" }}
              >
                Period Tracker
              </span>
              <button
                data-testid="button-period-sheet-close"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: "hsl(340 35% 92%)",
                  color: "hsl(340, 50%, 48%)",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* scrollable content */}
            <div
              className="overflow-y-auto flex-1 px-5 pb-10 pt-2"
              style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              <PeriodTracker />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PeriodTrackerSheet;
