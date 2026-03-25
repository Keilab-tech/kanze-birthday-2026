import { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  format, addDays, differenceInCalendarDays,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, startOfWeek, endOfWeek,
  parseISO, isToday, addMonths, subMonths,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  X, Check, RotateCcw, Calendar, Clock, Flower2, Lock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES & STORAGE
═══════════════════════════════════════════════════════════════════ */
interface PeriodLog {
  id: string;
  startDate: string;
  endDate: string | null;
}

type View = "welcome" | "onboarding" | "app";

const LS = {
  SETUP:  "kanze-period-setup-done",
  LOGS:   "kanze-period-logs",
  CYCLE:  "kanze-cycle-length",
};

const loadLogs = (): PeriodLog[] => {
  try { return JSON.parse(localStorage.getItem(LS.LOGS) ?? "[]"); }
  catch { return []; }
};
const saveLogs = (l: PeriodLog[]) =>
  localStorage.setItem(LS.LOGS, JSON.stringify(l));
const loadStoredCycle = (): number => {
  const v = parseInt(localStorage.getItem(LS.CYCLE) ?? "28", 10);
  return isNaN(v) ? 28 : v;
};

/* ═══════════════════════════════════════════════════════════════════
   CALCULATION HELPERS
═══════════════════════════════════════════════════════════════════ */
function computeAvgCycle(logs: PeriodLog[], fallback: number): number {
  const sorted = [...logs].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lengths: number[] = [];
  for (let i = 0; i < sorted.length - 1 && lengths.length < 3; i++) {
    const diff = differenceInCalendarDays(
      parseISO(sorted[i].startDate), parseISO(sorted[i + 1].startDate)
    );
    if (diff >= 15 && diff <= 65) lengths.push(diff);
  }
  if (!lengths.length) return fallback;
  return Math.round(lengths.reduce((s, l) => s + l, 0) / lengths.length);
}

function getLoggedDays(logs: PeriodLog[]): Date[] {
  const days: Date[] = [];
  for (const log of logs) {
    const start = parseISO(log.startDate);
    const end   = log.endDate ? parseISO(log.endDate) : new Date();
    const cap   = Math.min(differenceInCalendarDays(end, start), 9);
    for (let i = 0; i <= cap; i++) days.push(addDays(start, i));
  }
  return days;
}

function getPrediction(logs: PeriodLog[], avgCycle: number) {
  if (!logs.length) return null;
  const sorted      = [...logs].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const latestStart = parseISO(sorted[0].startDate);
  const nextStart   = addDays(latestStart, avgCycle);
  const ovulation   = addDays(nextStart, -14);
  const fertileDays = eachDayOfInterval({
    start: addDays(ovulation, -4), end: addDays(ovulation, 1),
  });
  const predictedPeriodDays = Array.from({ length: 5 }, (_, i) => addDays(nextStart, i));
  return { nextStart, ovulation, predictedPeriodDays, fertileDays };
}

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════ */
const C = {
  period:    "hsl(350,68%,58%)",
  periodBg:  "hsl(350,68%,58%)",
  predicted: "hsl(350,75%,91%)",
  fertile:   "hsl(272,55%,87%)",
  ovulation: "hsl(272,58%,62%)",
  today:     "hsl(215,70%,90%)",
  todayText: "hsl(215,60%,42%)",
  textMain:  "hsl(240,12%,18%)",
  textMid:   "hsl(240,8%,45%)",
  textLight: "hsl(240,8%,65%)",
  border:    "hsl(240,10%,92%)",
  card:      "#ffffff",
  bg:        "hsl(0,0%,97%)",
  font:      "'Quicksand',sans-serif",
};

/* ═══════════════════════════════════════════════════════════════════
   WELCOME SCREEN
═══════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Calendar,
    color: "hsl(350,68%,58%)",
    bg: "hsl(350,80%,96%)",
    title: "Period prediction",
    desc: "Know your next period date before it arrives, so you're always prepared.",
  },
  {
    icon: Flower2,
    color: "hsl(272,58%,62%)",
    bg: "hsl(272,60%,96%)",
    title: "Fertile window",
    desc: "See your most fertile days and ovulation estimate each cycle.",
  },
  {
    icon: Clock,
    color: "hsl(215,65%,55%)",
    bg: "hsl(215,70%,96%)",
    title: "Cycle tracking",
    desc: "Log your periods and watch your patterns improve over time.",
  },
  {
    icon: Lock,
    color: "hsl(145,55%,45%)",
    bg: "hsl(145,60%,96%)",
    title: "Completely private",
    desc: "All data stays on your device — nothing is shared or uploaded.",
  },
];

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => (
  <div style={{
    display: "flex", flexDirection: "column",
    minHeight: "100%", background: "#fff",
  }}>
    {/* Hero */}
    <div style={{
      background: "linear-gradient(160deg, hsl(350,75%,96%) 0%, hsl(330,60%,97%) 50%, #fff 100%)",
      padding: "32px 24px 28px",
      textAlign: "center",
    }}>
      {/* Photo */}
      <div style={{
        width: 88, height: 88, borderRadius: "50%",
        overflow: "hidden", margin: "0 auto 18px",
        border: "3px solid hsl(350,60%,82%)",
        boxShadow: "0 8px 28px hsl(350 60% 60% / 0.22)",
      }}>
        <img
          src="/images/gallery/photo1.jpeg"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          draggable={false}
        />
      </div>

      <h1 style={{
        margin: 0,
        fontSize: 26, fontWeight: 800, fontFamily: C.font,
        color: C.textMain, letterSpacing: "-0.02em",
      }}>
        Kanze Cycles
      </h1>
      <p style={{
        margin: "6px 0 0",
        fontSize: 14, fontFamily: C.font, color: C.textMid, lineHeight: 1.5,
      }}>
        Your personal cycle companion ✨
      </p>
    </div>

    {/* How it works */}
    <div style={{ padding: "22px 20px", flex: 1 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, fontFamily: C.font,
        color: C.textLight, textTransform: "uppercase",
        letterSpacing: "0.12em", marginBottom: 16,
      }}>
        What you get
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            background: "#fff", borderRadius: 16, padding: "14px 14px",
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 4px hsl(240 10% 10% / 0.04)",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: bg, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={18} color={color} strokeWidth={2} />
            </div>
            <div style={{ paddingTop: 2 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: C.font, color: C.textMain }}>
                {title}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, fontFamily: C.font, color: C.textMid, lineHeight: 1.45 }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div style={{ padding: "12px 20px 28px" }}>
      <p style={{
        textAlign: "center", fontSize: 11, fontFamily: C.font,
        color: C.textLight, marginBottom: 12,
      }}>
        Takes less than a minute to set up
      </p>
      <button
        data-testid="button-welcome-get-started"
        onClick={onStart}
        style={{
          width: "100%", padding: "16px", borderRadius: 18, border: "none",
          background: `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,50%) 100%)`,
          color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: C.font,
          cursor: "pointer", boxShadow: "0 6px 24px hsl(350 65% 55% / 0.32)",
          letterSpacing: "0.01em",
        }}
      >
        Get Started →
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   ONBOARDING (2-step)
═══════════════════════════════════════════════════════════════════ */
const Onboarding = ({ onSave }: { onSave: () => void }) => {
  const [step,     setStep]     = useState<1 | 2>(1);
  const [lastDate, setLastDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cycle,    setCycle]    = useState(28);

  function handleSave() {
    saveLogs([{ id: Date.now().toString(), startDate: lastDate, endDate: null }]);
    localStorage.setItem(LS.CYCLE, cycle.toString());
    localStorage.setItem(LS.SETUP, "true");
    onSave();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 14, padding: "14px 16px",
    fontSize: 15, fontFamily: C.font, fontWeight: 600,
    color: C.textMain, background: C.bg,
    border: `1.5px solid ${C.border}`, outline: "none",
    WebkitAppearance: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#fff" }}>
      {/* Progress bar */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              height: 4, flex: 1, borderRadius: 99,
              background: n <= step ? C.period : C.border,
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        <p style={{
          fontSize: 11, fontWeight: 700, fontFamily: C.font,
          color: C.textLight, textTransform: "uppercase",
          letterSpacing: "0.12em", marginBottom: 6,
        }}>
          Step {step} of 2
        </p>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            style={{ padding: "0 20px", flex: 1 }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, fontFamily: C.font, color: C.textMain, lineHeight: 1.2 }}>
              When did your last period start?
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, fontFamily: C.font, color: C.textMid, lineHeight: 1.5 }}>
              This is the first day of your most recent period. We'll use this to start predicting your cycle.
            </p>
            <label style={{
              display: "block", fontSize: 11, fontWeight: 700, fontFamily: C.font,
              color: C.textMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
            }}>
              First day of last period
            </label>
            <input
              data-testid="input-last-period-date"
              type="date"
              value={lastDate}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={e => setLastDate(e.target.value)}
              style={inputStyle}
            />

            <div style={{
              marginTop: 16, padding: "12px 14px", borderRadius: 12,
              background: "hsl(350,75%,97%)", border: "1px solid hsl(350,60%,90%)",
            }}>
              <p style={{ margin: 0, fontSize: 12, fontFamily: C.font, color: "hsl(350,55%,50%)", lineHeight: 1.45 }}>
                💡 If you're not sure of the exact date, choose the closest date you remember. You can always edit it later.
              </p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            style={{ padding: "0 20px", flex: 1 }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, fontFamily: C.font, color: C.textMain, lineHeight: 1.2 }}>
              How long is your cycle?
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, fontFamily: C.font, color: C.textMid, lineHeight: 1.5 }}>
              Count the days from the first day of one period to the day before the next. Most people have a cycle between 21–35 days.
            </p>

            {/* Cycle length picker */}
            <div style={{
              background: C.bg, borderRadius: 18, padding: "20px",
              border: `1.5px solid ${C.border}`, textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <button
                  onClick={() => setCycle(v => Math.max(21, v - 1))}
                  style={{
                    width: 44, height: 44, borderRadius: "50%", border: "none",
                    background: C.card, cursor: "pointer",
                    boxShadow: "0 2px 8px hsl(240 10% 10% / 0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, color: C.textMid, fontWeight: 700,
                  }}
                >−</button>
                <div>
                  <span style={{
                    fontSize: 52, fontWeight: 800, fontFamily: C.font,
                    color: C.period, lineHeight: 1,
                  }}>
                    {cycle}
                  </span>
                  <p style={{ margin: "2px 0 0", fontSize: 12, fontFamily: C.font, color: C.textLight }}>
                    days
                  </p>
                </div>
                <button
                  onClick={() => setCycle(v => Math.min(45, v + 1))}
                  style={{
                    width: 44, height: 44, borderRadius: "50%", border: "none",
                    background: C.card, cursor: "pointer",
                    boxShadow: "0 2px 8px hsl(240 10% 10% / 0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, color: C.textMid, fontWeight: 700,
                  }}
                >+</button>
              </div>

              {/* visual range bar */}
              <div style={{ marginTop: 16, height: 4, borderRadius: 99, background: C.border, position: "relative" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, height: "100%",
                  width: `${((cycle - 21) / (45 - 21)) * 100}%`,
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${C.period}, hsl(340,70%,50%))`,
                  transition: "width 0.2s",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, fontFamily: C.font, color: C.textLight }}>21 days</span>
                <span style={{ fontSize: 10, fontFamily: C.font, color: C.textLight }}>45 days</span>
              </div>
            </div>

            <p style={{ marginTop: 14, fontSize: 12, fontFamily: C.font, color: C.textLight, textAlign: "center" }}>
              Not sure? The default of 28 is a great starting point.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      <div style={{ padding: "20px 20px 28px", display: "flex", gap: 10 }}>
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            style={{
              flex: 1, padding: "15px", borderRadius: 16, border: `1.5px solid ${C.border}`,
              background: C.card, color: C.textMid, fontSize: 14,
              fontWeight: 700, fontFamily: C.font, cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
        <button
          data-testid={step === 1 ? "button-onboarding-next" : "button-period-setup-save"}
          onClick={step === 1 ? () => setStep(2) : handleSave}
          style={{
            flex: 2, padding: "15px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,50%) 100%)`,
            color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: C.font,
            cursor: "pointer", boxShadow: "0 6px 20px hsl(350 65% 55% / 0.28)",
          }}
        >
          {step === 1 ? "Next →" : "Start tracking ✨"}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LOG MODAL  (portal – escapes framer-motion stacking context)
═══════════════════════════════════════════════════════════════════ */
interface LogModalProps {
  mode: "add" | "edit";
  initialStart: string;
  initialEnd: string | null;
  onSave: (start: string, end: string | null) => void;
  onClose: () => void;
}

const LogModal = ({ mode, initialStart, initialEnd, onSave, onClose }: LogModalProps) => {
  const [start,   setStart]   = useState(initialStart);
  const [end,     setEnd]     = useState(initialEnd ?? "");
  const [ongoing, setOngoing] = useState(!initialEnd);
  const today = format(new Date(), "yyyy-MM-dd");

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 14, padding: "13px 15px",
    fontSize: 15, fontFamily: C.font, fontWeight: 600,
    color: C.textMain, background: C.bg,
    border: `1.5px solid ${C.border}`, outline: "none",
    WebkitAppearance: "none", boxSizing: "border-box",
  };

  const content = (
    <>
      <motion.div
        key="log-bg"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 62, background: "hsl(240 15% 8% / 0.52)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
      />
      <motion.div
        key="log-sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 63,
          background: "#fff", borderRadius: "24px 24px 0 0",
          boxShadow: "0 -4px 40px hsl(240 15% 10% / 0.14)",
          paddingBottom: "env(safe-area-inset-bottom, 20px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 16px" }}>
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: C.font, color: C.textMain }}>
            {mode === "add" ? "Log a cycle" : "Edit entry"}
          </span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.textMid} />
          </button>
        </div>

        <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Start date
            </label>
            <input data-testid="input-log-start-date" type="date" value={start} max={today} onChange={e => setStart(e.target.value)} style={inputStyle} />
          </div>

          <button
            data-testid="button-log-ongoing-toggle"
            onClick={() => setOngoing(!ongoing)}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${ongoing ? C.period : C.border}`,
              background: ongoing ? C.period : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s",
            }}>
              {ongoing && <Check size={13} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: C.font, color: C.textMid }}>
              Currently on period
            </span>
          </button>

          <AnimatePresence>
            {!ongoing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                style={{ overflow: "hidden" }}
              >
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  End date
                </label>
                <input data-testid="input-log-end-date" type="date" value={end} min={start} max={today} onChange={e => setEnd(e.target.value)} style={inputStyle} />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            data-testid="button-log-save"
            onClick={() => { if (start) { onSave(start, ongoing ? null : end || null); } }}
            disabled={!start}
            style={{
              marginTop: 4, width: "100%", padding: "16px", borderRadius: 18, border: "none",
              background: !start ? C.border : `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,50%) 100%)`,
              color: !start ? C.textLight : "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: C.font, cursor: start ? "pointer" : "default",
              boxShadow: start ? "0 6px 20px hsl(350 65% 55% / 0.28)" : "none",
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </>
  );

  return createPortal(<AnimatePresence>{content}</AnimatePresence>, document.body);
};

/* ═══════════════════════════════════════════════════════════════════
   CYCLE CALENDAR
═══════════════════════════════════════════════════════════════════ */
const CycleCalendar = ({
  month, loggedDays, predictedDays, fertileDays, ovulation, onPrev, onNext,
}: {
  month: Date; loggedDays: Date[]; predictedDays: Date[];
  fertileDays: Date[]; ovulation: Date | null;
  onPrev: () => void; onNext: () => void;
}) => {
  const allDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end:   endOfWeek(endOfMonth(month),     { weekStartsOn: 1 }),
  });

  const isLogged    = useCallback((d: Date) => loggedDays.some(x   => isSameDay(x, d)),  [loggedDays]);
  const isPredicted = useCallback((d: Date) => predictedDays.some(x => isSameDay(x, d)), [predictedDays]);
  const isFertile   = useCallback((d: Date) => fertileDays.some(x  => isSameDay(x, d)), [fertileDays]);
  const isOvulation = useCallback((d: Date) => !!ovulation && isSameDay(ovulation, d),   [ovulation]);

  return (
    <div style={{
      background: C.card, borderRadius: 20,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 12px hsl(240 10% 10% / 0.04)",
      overflow: "hidden",
    }}>
      {/* nav header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button
          data-testid="button-calendar-prev-month"
          onClick={onPrev}
          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={15} color={C.textMid} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: C.font, color: C.textMain }}>
          {format(month, "MMMM yyyy")}
        </span>
        <button
          data-testid="button-calendar-next-month"
          onClick={onNext}
          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronRight size={15} color={C.textMid} />
        </button>
      </div>

      <div style={{ padding: "8px 12px 12px" }}>
        {/* weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 2 }}>
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textLight, padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {allDays.map(day => {
            const inMonth  = isSameMonth(day, month);
            const logged   = isLogged(day);
            const pred     = isPredicted(day);
            const fertile  = isFertile(day);
            const ov       = isOvulation(day);
            const today    = isToday(day);

            let bg = "transparent", text = inMonth ? C.textMain : C.textLight, fw = 400;
            let ring = "none";

            if (logged)           { bg = C.periodBg; text = "#fff"; fw = 700; }
            else if (pred)        { bg = C.predicted; text = C.period; fw = 700; }
            else if (ov && inMonth)   { bg = C.ovulation; text = "#fff"; fw = 700; }
            else if (fertile && inMonth) { bg = C.fertile; text = "hsl(272,55%,40%)"; fw = 600; }
            else if (today && inMonth)   { bg = C.today; text = C.todayText; fw = 700; }

            if (today && inMonth && !logged) ring = `2px solid ${C.period}`;

            return (
              <div key={day.toISOString()} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 38 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", outline: ring, outlineOffset: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: fw, fontFamily: C.font, color: text, lineHeight: 1 }}>
                    {format(day, "d")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* legend */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "5px 12px",
        padding: "10px 16px 14px", borderTop: `1px solid ${C.border}`,
        justifyContent: "center",
      }}>
        {[
          { color: C.periodBg,  label: "Period" },
          { color: C.predicted, label: "Predicted", border: `1px solid ${C.period}` },
          { color: C.fertile,   label: "Fertile" },
          { color: C.ovulation, label: "Ovulation" },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, border: border ?? "none", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: C.font, color: C.textLight }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SUMMARY ROW
═══════════════════════════════════════════════════════════════════ */
const SummaryRow = ({
  daysUntilNext, nextStart, ovulation, avgCycle,
}: {
  daysUntilNext: number | null; nextStart: Date | null;
  ovulation: Date | null; avgCycle: number;
}) => {
  const cards = [
    {
      label: "Next cycle",
      value: nextStart ? format(nextStart, "MMM d") : "—",
      sub: daysUntilNext == null ? "" : daysUntilNext <= 0 ? "may have started" : daysUntilNext === 1 ? "tomorrow" : `in ${daysUntilNext}d`,
      color: C.period, bg: "hsl(350,70%,97%)",
    },
    {
      label: "Ovulation",
      value: ovulation ? format(ovulation, "MMM d") : "—",
      sub: ovulation ? "±2 days" : "",
      color: C.ovulation, bg: "hsl(272,55%,97%)",
    },
    {
      label: "Avg cycle",
      value: `${avgCycle}d`,
      sub: "length",
      color: "hsl(215,60%,52%)", bg: "hsl(215,60%,97%)",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {cards.map(({ label, value, sub, color, bg }) => (
        <div key={label} style={{
          background: bg, borderRadius: 16, padding: "13px 8px",
          textAlign: "center", border: `1px solid ${C.border}`,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, fontFamily: C.font, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {label}
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: C.font, color, lineHeight: 1 }}>
            {value}
          </p>
          {sub && (
            <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 600, fontFamily: C.font, color: C.textMid }}>
              {sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   HISTORY LIST
═══════════════════════════════════════════════════════════════════ */
const HistoryList = ({
  logs, onEdit, onDelete,
}: {
  logs: PeriodLog[]; onEdit: (l: PeriodLog) => void; onDelete: (id: string) => void;
}) => {
  const sorted = [...logs].sort((a, b) => b.startDate.localeCompare(a.startDate));
  if (!sorted.length) return (
    <div style={{ textAlign: "center", padding: "24px", color: C.textLight, fontFamily: C.font, fontSize: 13 }}>
      No entries yet — log your first cycle above.
    </div>
  );

  return (
    <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <p style={{ padding: "14px 16px 8px", margin: 0, fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        History
      </p>
      {sorted.map((log, i) => {
        const start    = parseISO(log.startDate);
        const end      = log.endDate ? parseISO(log.endDate) : null;
        const duration = end ? differenceInCalendarDays(end, start) + 1 : null;
        return (
          <div key={log.id} style={{
            display: "flex", alignItems: "center", padding: "11px 16px",
            borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: log.endDate ? C.periodBg : C.ovulation, marginRight: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: C.font, color: C.textMain }}>
                {format(start, "MMM d, yyyy")}
                {end && ` – ${format(end, "MMM d")}`}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, fontFamily: C.font, color: C.textLight }}>
                {log.endDate ? `${duration} day${duration !== 1 ? "s" : ""}` : "Ongoing"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                data-testid={`button-history-edit-${log.id}`}
                onClick={() => onEdit(log)}
                style={{ width: 30, height: 30, borderRadius: 10, border: "none", background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Pencil size={13} color={C.textMid} />
              </button>
              <button
                data-testid={`button-history-delete-${log.id}`}
                onClick={() => onDelete(log.id)}
                style={{ width: 30, height: 30, borderRadius: 10, border: "none", background: "hsl(350,80%,97%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={13} color="hsl(350,65%,56%)" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP VIEW
═══════════════════════════════════════════════════════════════════ */
interface ModalState {
  open: boolean; mode: "add" | "edit"; editingId: string | null;
  initialStart: string; initialEnd: string | null;
}

const AppView = ({ onReset }: { onReset: () => void }) => {
  const [logs,        setLogs]        = useState<PeriodLog[]>(loadLogs);
  const [storedCycle, setStoredCycle] = useState(loadStoredCycle);
  const [calMonth,    setCalMonth]    = useState(() => new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    open: false, mode: "add", editingId: null,
    initialStart: format(new Date(), "yyyy-MM-dd"), initialEnd: null,
  });

  const avgCycle   = useMemo(() => computeAvgCycle(logs, storedCycle), [logs, storedCycle]);
  const loggedDays = useMemo(() => getLoggedDays(logs), [logs]);
  const prediction = useMemo(() => getPrediction(logs, avgCycle), [logs, avgCycle]);
  const activeLog  = logs.find(l => l.endDate === null);

  const daysUntilNext = prediction
    ? differenceInCalendarDays(prediction.nextStart, new Date())
    : null;

  function persist(updated: PeriodLog[]) { saveLogs(updated); setLogs(updated); }

  function openAdd() {
    const today = format(new Date(), "yyyy-MM-dd");
    if (logs.some(l => l.startDate === today)) return;
    setModal({ open: true, mode: "add", editingId: null, initialStart: today, initialEnd: null });
  }

  function handleModalSave(start: string, end: string | null) {
    if (modal.mode === "add") {
      persist([...logs, { id: Date.now().toString(), startDate: start, endDate: end }]);
    } else {
      persist(logs.map(l => l.id === modal.editingId ? { ...l, startDate: start, endDate: end } : l));
    }
    setModal(m => ({ ...m, open: false }));
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this entry?")) return;
    persist(logs.filter(l => l.id !== id));
  }

  function handleReset() {
    if (!confirm("Reset all cycle data? This can't be undone.")) return;
    [LS.SETUP, LS.LOGS, LS.CYCLE].forEach(k => localStorage.removeItem(k));
    onReset();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: C.bg }}>
      {/* App header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,50%) 100%)`,
        padding: "20px 20px 28px",
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative circles */}
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "hsl(0 0% 100% / 0.08)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 40, width: 80, height: 80, borderRadius: "50%", background: "hsl(0 0% 100% / 0.06)" }} />

        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, fontFamily: C.font, color: "hsl(0 0% 100% / 0.7)", letterSpacing: "0.08em" }}>
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        {daysUntilNext !== null && prediction ? (
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: C.font, color: "#fff", lineHeight: 1.2 }}>
            {daysUntilNext <= 0
              ? "Period may have started"
              : daysUntilNext === 1
              ? "Period arrives tomorrow"
              : `Period in ${daysUntilNext} days`}
          </h2>
        ) : (
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: C.font, color: "#fff" }}>
            Welcome back ✨
          </h2>
        )}
        {prediction && (
          <p style={{ margin: "4px 0 0", fontSize: 12, fontFamily: C.font, color: "hsl(0 0% 100% / 0.75)" }}>
            Next expected {format(prediction.nextStart, "MMMM d, yyyy")}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 100 }}>
        {/* Summary cards */}
        <SummaryRow
          daysUntilNext={daysUntilNext}
          nextStart={prediction?.nextStart ?? null}
          ovulation={prediction?.ovulation ?? null}
          avgCycle={avgCycle}
        />

        {/* Active period banner */}
        {activeLog && (
          <div style={{
            background: "hsl(350,75%,97%)", border: `1px solid hsl(350,65%,88%)`,
            borderRadius: 16, padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.period, boxShadow: `0 0 0 3px hsl(350,70%,88%)` }} />
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: C.font, color: C.period }}>
                Period in progress
              </span>
            </div>
            <button
              data-testid="button-end-period"
              onClick={() => persist(logs.map(l => l.id === activeLog.id ? { ...l, endDate: format(new Date(), "yyyy-MM-dd") } : l))}
              style={{
                padding: "7px 16px", borderRadius: 99, border: "none",
                background: C.period, color: "#fff",
                fontSize: 12, fontWeight: 700, fontFamily: C.font, cursor: "pointer",
              }}
            >
              End today
            </button>
          </div>
        )}

        {/* Calendar */}
        <CycleCalendar
          month={calMonth}
          loggedDays={loggedDays}
          predictedDays={prediction?.predictedPeriodDays ?? []}
          fertileDays={prediction?.fertileDays ?? []}
          ovulation={prediction?.ovulation ?? null}
          onPrev={() => setCalMonth(m => subMonths(m, 1))}
          onNext={() => setCalMonth(m => addMonths(m, 1))}
        />

        {/* History toggle */}
        <button
          data-testid="button-history-toggle"
          onClick={() => setShowHistory(v => !v)}
          style={{
            background: C.card, borderRadius: 16, padding: "13px 16px",
            border: `1px solid ${C.border}`, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: C.font, color: C.textMain }}>
            Cycle history
          </span>
          <ChevronRight
            size={16} color={C.textLight}
            style={{ transform: showHistory ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
          />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              key="history"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
              style={{ overflow: "hidden" }}
            >
              <HistoryList
                logs={logs}
                onEdit={log => setModal({ open: true, mode: "edit", editingId: log.id, initialStart: log.startDate, initialEnd: log.endDate })}
                onDelete={handleDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset */}
        <button
          data-testid="button-cycle-reset"
          onClick={handleReset}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0 2px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <RotateCcw size={11} color={C.textLight} />
          <span style={{ fontSize: 11, fontFamily: C.font, color: C.textLight }}>Reset all data</span>
        </button>
      </div>

      {/* FAB */}
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <motion.button
          data-testid="button-period-fab"
          onClick={openAdd}
          whileTap={{ scale: 0.93 }}
          style={{
            pointerEvents: "all",
            padding: "15px 36px", borderRadius: 99, border: "none",
            background: `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,50%) 100%)`,
            color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: C.font,
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            boxShadow: "0 8px 28px hsl(350 65% 55% / 0.38)",
          }}
        >
          <Plus size={18} strokeWidth={3} />
          Log cycle
        </motion.button>
      </div>

      {/* Log modal */}
      {modal.open && (
        <LogModal
          mode={modal.mode}
          initialStart={modal.initialStart}
          initialEnd={modal.initialEnd}
          onSave={handleModalSave}
          onClose={() => setModal(m => ({ ...m, open: false }))}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ROOT COMPONENT — manages view transitions
═══════════════════════════════════════════════════════════════════ */
const PeriodTracker = () => {
  const [view, setView] = useState<View>(
    () => localStorage.getItem(LS.SETUP) === "true" ? "app" : "welcome"
  );

  return (
    <AnimatePresence mode="wait">
      {view === "welcome" && (
        <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} style={{ minHeight: "100%" }}>
          <WelcomeScreen onStart={() => setView("onboarding")} />
        </motion.div>
      )}
      {view === "onboarding" && (
        <motion.div key="onboard" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} style={{ minHeight: "100%" }}>
          <Onboarding onSave={() => setView("app")} />
        </motion.div>
      )}
      {view === "app" && (
        <motion.div key="app" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ minHeight: "100%", position: "relative" }}>
          <AppView onReset={() => setView("welcome")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PeriodTracker;
