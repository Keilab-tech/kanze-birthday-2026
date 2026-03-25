import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import PeriodTracker from "./PeriodTracker";

const PeriodTrackerSheet = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Floating trigger — round, just below the home button ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.4, type: "spring", stiffness: 200 }}
        style={{
          position: "fixed",
          top: 72,        /* home button is top-4 (16px) + h-11 (44px) + 12px gap */
          left: 16,
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* photo circle button */}
        <motion.button
          data-testid="button-period-tracker-open"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          title=" "
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "2.5px solid hsl(0 0% 100% / 0.85)",
            boxShadow: "0 2px 16px hsl(340 50% 65% / 0.28), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            overflow: "hidden",
            cursor: "pointer",
            padding: 0,
            background: "none",
            display: "block",
            flexShrink: 0,
          }}
        >
          <img
            src="/images/gallery/photo1.jpeg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            draggable={false}
          />
        </motion.button>

        {/* label */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "'Quicksand', sans-serif",
            color: "hsl(340, 55%, 45%)",
            letterSpacing: "0.04em",
            textAlign: "center",
            lineHeight: 1.2,
            textShadow: "0 1px 4px hsl(0 0% 100% / 0.8)",
            whiteSpace: "nowrap",
          }}
        >
          Kanze Cycles
        </span>
      </motion.div>

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
                {/* mini photo + title */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    overflow: "hidden", flexShrink: 0,
                    border: "2px solid hsl(340,60%,85%)",
                  }}>
                    <img
                      src="/images/gallery/photo1.jpeg"
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      draggable={false}
                    />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Quicksand', sans-serif", color: "hsl(240,12%,22%)" }}>
                    Kanze Cycles
                  </span>
                </div>
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
