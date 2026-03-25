import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import PeriodTracker from "./PeriodTracker";

/* Hidden floating trigger + full slide-up sheet.
   The edge button is deliberately minimal — nothing about its purpose is obvious. */

const PeriodTrackerSheet = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Floating trigger — flush with right edge, half-pill ── */}
      <motion.button
        data-testid="button-period-tracker-open"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.2, duration: 0.5, type: "spring", stiffness: 200 }}
        whileTap={{ scale: 0.88 }}
        title=" "
        style={{
          position: "fixed",
          bottom: 72,
          right: 0,
          zIndex: 40,
          width: 36,
          height: 36,
          borderRadius: "50% 0 0 50%",
          background: "hsl(350 62% 50% / 0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid hsl(350 50% 60% / 0.4)",
          borderRight: "none",
          boxShadow: "-3px 2px 16px hsl(350 60% 45% / 0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          paddingRight: 2,
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1, userSelect: "none" }}>🩸</span>
      </motion.button>

      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="pt-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "hsl(240 15% 8% / 0.5)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
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
              bottom: 0, left: 0, right: 0,
              zIndex: 51,
              maxHeight: "92dvh",
              borderRadius: "24px 24px 0 0",
              background: "hsl(0,0%,98%)",
              boxShadow: "0 -6px 40px hsl(240 15% 15% / 0.14)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* header bar */}
            <div style={{ flexShrink: 0, position: "relative", padding: "16px 20px 12px" }}>
              {/* drag pill */}
              <div style={{
                position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
                width: 36, height: 4, borderRadius: 99,
                background: "hsl(240,10%,88%)",
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Quicksand', sans-serif", color: "hsl(240,12%,22%)" }}>
                  Cycle
                </span>
                <button
                  data-testid="button-period-sheet-close"
                  onClick={() => setOpen(false)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", border: "none",
                    background: "hsl(240,10%,94%)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={15} color="hsl(240,8%,48%)" />
                </button>
              </div>
            </div>

            {/* divider */}
            <div style={{ height: 1, background: "hsl(240,10%,92%)", flexShrink: 0 }} />

            {/* scrollable content */}
            <div
              style={{
                flex: 1, overflowY: "auto", padding: "16px 16px 0",
                WebkitOverflowScrolling: "touch",
                position: "relative",
              } as React.CSSProperties}
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
