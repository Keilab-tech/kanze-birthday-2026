import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* Floating button just below the Home button (top-left).
   Tapping it navigates to the full /cycles page. */

const PeriodTrackerSheet = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      data-testid="button-cycles-open"
      onClick={() => navigate("/cycles")}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.8, duration: 0.45, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.88 }}
      title=" "
      style={{
        position: "fixed",
        /* home button is top-4 (16px) h-11 (44px) → bottom at 60px; 8px gap → 68px */
        top: 68,
        left: 16,
        zIndex: 30,
        width: 44,
        height: 44,
        borderRadius: "50%",
        padding: 0,
        overflow: "hidden",
        cursor: "pointer",
        border: "2.5px solid hsl(340, 60%, 80%)",
        boxShadow:
          "0 3px 14px hsl(340 55% 60% / 0.30), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
        background: "hsl(340, 80%, 94%)",
      }}
    >
      <img
        src="/images/gallery/photo1.jpeg"
        alt=""
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </motion.button>
  );
};

export default PeriodTrackerSheet;
