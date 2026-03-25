import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import PeriodTracker from "./PeriodTracker";

/* Discreet floating trigger + full-screen slide-up modal.
   Opens Kanze Cycles as its own standalone app experience. */

const PeriodTrackerSheet = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Floating trigger — round photo button, just below home button ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.45, type: "spring", stiffness: 200 }}
        style={{
          position: "fixed", top: 72, left: 16, zIndex: 30,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}
      >
        <motion.button
          data-testid="button-period-tracker-open"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          title=" "
          style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "2.5px solid hsl(0 0% 100% / 0.88)",
            boxShadow: "0 3px 14px hsl(340 50% 60% / 0.28), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
            overflow: "hidden", cursor: "pointer", padding: 0,
            background: "none", display: "block", flexShrink: 0,
          }}
        >
          <img
            src="/images/kanze-cycles-logo.jpeg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            draggable={false}
          />
        </motion.button>
        <span style={{
          fontSize: 8.5, fontWeight: 700, fontFamily: "'Quicksand',sans-serif",
          color: "hsl(340,55%,42%)", letterSpacing: "0.04em", textAlign: "center",
          lineHeight: 1.2, textShadow: "0 1px 4px hsl(0 0% 100% / 0.9)",
          whiteSpace: "nowrap",
        }}>
          Kanze Cycles
        </span>
      </motion.div>

      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="kc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "hsl(240 15% 8% / 0.55)",
              backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Full-screen slide-up modal ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="kc-modal"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            style={{
              position: "fixed",
              /* Leave a small peek at the top so it feels like a card floating above */
              top: "4dvh",
              left: 0, right: 0, bottom: 0,
              zIndex: 51,
              borderRadius: "26px 26px 0 0",
              background: "hsl(0,0%,97%)",
              boxShadow: "0 -8px 48px hsl(240 15% 10% / 0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── Floating close button ── */}
            <motion.button
              data-testid="button-period-sheet-close"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                position: "absolute", top: 14, right: 16, zIndex: 10,
                width: 34, height: 34, borderRadius: "50%", border: "none",
                background: "hsl(0 0% 100% / 0.9)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                boxShadow: "0 2px 12px hsl(240 10% 10% / 0.12)",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={15} color="hsl(240,8%,40%)" />
            </motion.button>

            {/* drag pill */}
            <div style={{
              position: "absolute", top: 10, left: "50%",
              transform: "translateX(-50%)",
              width: 38, height: 4, borderRadius: 99,
              background: "hsl(240,10%,86%)", zIndex: 10,
            }} />

            {/* scrollable content — fills entire modal */}
            <div
              style={{
                flex: 1, overflowY: "auto",
                WebkitOverflowScrolling: "touch",
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
