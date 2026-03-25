import { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  format, addDays, differenceInCalendarDays,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, startOfWeek, endOfWeek,
  parseISO, isToday, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES & STORAGE
═══════════════════════════════════════════════════════════════════ */
interface PeriodLog {
  id: string;
  startDate: string; // yyyy-MM-dd
  endDate: string | null;
}

const LS = {
  SETUP: "kanze-period-setup-done",
  LOGS:  "kanze-period-logs",
  CYCLE: "kanze-cycle-length",
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

/** Average of last ≤3 cycles computed from consecutive start dates */
function computeAvgCycle(logs: PeriodLog[], fallback: number): number {
  const sorted = [...logs].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );
  const lengths: number[] = [];
  for (let i = 0; i < sorted.length - 1 && lengths.length < 3; i++) {
    const diff = differenceInCalendarDays(
      parseISO(sorted[i].startDate),
      parseISO(sorted[i + 1].startDate)
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
    const end = log.endDate ? parseISO(log.endDate) : new Date();
    const cap = Math.min(differenceInCalendarDays(end, start), 9);
    for (let i = 0; i <= cap; i++) days.push(addDays(start, i));
  }
  return days;
}

function getPrediction(logs: PeriodLog[], avgCycle: number) {
  if (!logs.length) return null;
  const sorted = [...logs].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );
  const latestStart  = parseISO(sorted[0].startDate);
  const nextStart    = addDays(latestStart, avgCycle);
  const ovulation    = addDays(nextStart, -14);
  const fertileStart = addDays(ovulation, -4);
  const fertileEnd   = addDays(ovulation, 1);
  const predictedPeriodDays = Array.from({ length: 5 }, (_, i) =>
    addDays(nextStart, i)
  );
  const fertileDays = eachDayOfInterval({
    start: fertileStart, end: fertileEnd,
  });
  return { nextStart, ovulation, predictedPeriodDays, fertileDays };
}

/* ═══════════════════════════════════════════════════════════════════
   HEART PHOTO AVATAR (kept from previous version)
═══════════════════════════════════════════════════════════════════ */
const HeartPhoto = ({ size = 28 }: { size?: number }) => {
  const s = size;
  const path = `M${s/2} ${s*0.88} C${s/2} ${s*0.88} ${s*0.09} ${s*0.59} ${s*0.09} ${s*0.32} C${s*0.09} ${s*0.17} ${s*0.21} ${s*0.07} ${s*0.35} ${s*0.07} C${s*0.42} ${s*0.07} ${s*0.46} ${s*0.12} ${s/2} ${s*0.2} C${s*0.54} ${s*0.12} ${s*0.58} ${s*0.07} ${s*0.65} ${s*0.07} C${s*0.79} ${s*0.07} ${s*0.91} ${s*0.17} ${s*0.91} ${s*0.32} C${s*0.91} ${s*0.59} ${s/2} ${s*0.88} ${s/2} ${s*0.88} Z`;
  return (
    <div style={{ width: size, height: size, flexShrink: 0, clipPath: `path('${path}')` }}>
      <img
        src="/images/gallery/photo1.jpeg"
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        draggable={false}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SHARED STYLE TOKENS
═══════════════════════════════════════════════════════════════════ */
const C = {
  period:    "hsl(350, 68%, 58%)",
  periodBg:  "hsl(350, 70%, 58%)",
  predicted: "hsl(350, 75%, 89%)",
  fertile:   "hsl(272, 55%, 87%)",
  ovulation: "hsl(272, 58%, 62%)",
  today:     "hsl(215, 70%, 90%)",
  todayText: "hsl(215, 60%, 42%)",
  textMain:  "hsl(240, 12%, 22%)",
  textMid:   "hsl(240, 8%,  48%)",
  textLight: "hsl(240, 8%,  68%)",
  border:    "hsl(240, 10%, 92%)",
  card:      "hsl(0, 0%, 100%)",
  bg:        "hsl(0, 0%, 98%)",
  accent:    "hsl(350, 68%, 58%)",
  font:      "'Quicksand', sans-serif",
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
  const [start, setStart] = useState(initialStart);
  const [end,   setEnd]   = useState(initialEnd ?? "");
  const [ongoing, setOngoing] = useState(!initialEnd);

  const today = format(new Date(), "yyyy-MM-dd");

  function handleSave() {
    if (!start) return;
    onSave(start, ongoing ? null : end || null);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: C.font,
    fontWeight: 600,
    color: C.textMain,
    background: C.bg,
    border: `1.5px solid ${C.border}`,
    outline: "none",
    WebkitAppearance: "none",
  };

  const content = (
    <>
      {/* backdrop */}
      <motion.div
        key="log-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 62,
          background: "hsl(240 15% 8% / 0.55)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
      />

      {/* sheet */}
      <motion.div
        key="log-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 63,
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "0 0 env(safe-area-inset-bottom, 20px)",
          boxShadow: "0 -4px 40px hsl(240 15% 15% / 0.14)",
        }}
      >
        {/* drag pill */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border }} />
        </div>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: C.font, color: C.textMain }}>
            {mode === "add" ? "Log cycle" : "Edit entry"}
          </span>
          <button
            data-testid="button-log-modal-close"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: C.bg, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color={C.textMid} />
          </button>
        </div>

        {/* form */}
        <div style={{ padding: "0 20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* start date */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Start date
            </label>
            <input
              data-testid="input-log-start-date"
              type="date"
              value={start}
              max={today}
              onChange={(e) => setStart(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* ongoing toggle */}
          <button
            data-testid="button-log-ongoing-toggle"
            onClick={() => setOngoing(!ongoing)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${ongoing ? C.accent : C.border}`,
              background: ongoing ? C.accent : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {ongoing && <Check size={13} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: C.font, color: C.textMid }}>
              Currently on period
            </span>
          </button>

          {/* end date */}
          <AnimatePresence>
            {!ongoing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  End date
                </label>
                <input
                  data-testid="input-log-end-date"
                  type="date"
                  value={end}
                  min={start}
                  max={today}
                  onChange={(e) => setEnd(e.target.value)}
                  style={inputStyle}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* save */}
          <button
            data-testid="button-log-save"
            onClick={handleSave}
            disabled={!start}
            style={{
              marginTop: 4,
              width: "100%", padding: "15px", borderRadius: 18, border: "none",
              background: `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,52%) 100%)`,
              color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: C.font,
              cursor: "pointer",
              boxShadow: `0 6px 20px hsl(350 65% 55% / 0.32)`,
              opacity: start ? 1 : 0.5,
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </>
  );

  return createPortal(
    <AnimatePresence>{content}</AnimatePresence>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════════════════════
   CYCLE CALENDAR
═══════════════════════════════════════════════════════════════════ */
interface CalendarProps {
  month: Date;
  loggedDays: Date[];
  predictedDays: Date[];
  fertileDays: Date[];
  ovulation: Date | null;
  onPrev: () => void;
  onNext: () => void;
}
const CycleCalendar = ({ month, loggedDays, predictedDays, fertileDays, ovulation, onPrev, onNext }: CalendarProps) => {
  const monthStart = startOfMonth(month);
  const monthEnd   = endOfMonth(month);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const allDays    = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const isLogged    = useCallback((d: Date) => loggedDays.some(x  => isSameDay(x, d)),    [loggedDays]);
  const isPredicted = useCallback((d: Date) => predictedDays.some(x => isSameDay(x, d)), [predictedDays]);
  const isFertile   = useCallback((d: Date) => fertileDays.some(x  => isSameDay(x, d)),  [fertileDays]);
  const isOvulation = useCallback((d: Date) => ovulation != null && isSameDay(ovulation, d), [ovulation]);

  return (
    <div style={{ background: C.card, borderRadius: 18, padding: "16px 12px 12px", border: `1px solid ${C.border}` }}>
      {/* nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
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

      {/* weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textLight, padding: "2px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {allDays.map(day => {
          const inMonth  = isSameMonth(day, month);
          const logged   = isLogged(day);
          const predicted = isPredicted(day);
          const fertile  = isFertile(day);
          const ovDay    = isOvulation(day);
          const today    = isToday(day);

          // priority: logged > predicted > fertile/ovulation > today
          let bg        = "transparent";
          let textColor = inMonth ? C.textMain : C.textLight;
          let ring      = "none";
          let dotColor  = "";

          if (logged) {
            bg = C.periodBg; textColor = "#fff";
          } else if (predicted) {
            bg = C.predicted; textColor = C.period;
          } else if (ovDay && inMonth) {
            bg = C.ovulation; textColor = "#fff";
          } else if (fertile && inMonth) {
            bg = C.fertile; textColor = "hsl(272,55%,42%)";
          } else if (today && inMonth) {
            bg = C.today; textColor = C.todayText;
          }

          if (today && inMonth && !logged) ring = `2px solid ${C.period}`;
          if (ovDay && inMonth && !logged) dotColor = "#fff";

          return (
            <div key={day.toISOString()} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36 }}>
              <div style={{ position: "relative", width: 30, height: 30, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", outline: ring, outlineOffset: 1 }}>
                <span style={{ fontSize: 12, fontWeight: logged || predicted || ovDay || (today && inMonth) ? 700 : 400, fontFamily: C.font, color: textColor, lineHeight: 1 }}>
                  {format(day, "d")}
                </span>
                {dotColor && (
                  <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: dotColor }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 12, justifyContent: "center" }}>
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
   SUMMARY CARDS ROW
═══════════════════════════════════════════════════════════════════ */
const SummaryRow = ({
  daysUntilNext, nextStart, ovulation, avgCycle,
}: {
  daysUntilNext: number | null;
  nextStart: Date | null;
  ovulation: Date | null;
  avgCycle: number;
}) => {
  const cards = [
    {
      label: "Next cycle",
      value: nextStart ? format(nextStart, "MMM d") : "—",
      sub: daysUntilNext == null ? "" : daysUntilNext <= 0 ? "may have started" : daysUntilNext === 1 ? "tomorrow" : `in ${daysUntilNext}d`,
      accent: C.period,
      bg: "hsl(350,70%,97%)",
    },
    {
      label: "Ovulation",
      value: ovulation ? format(ovulation, "MMM d") : "—",
      sub: ovulation ? `±2 days` : "",
      accent: C.ovulation,
      bg: "hsl(272,55%,97%)",
    },
    {
      label: "Avg cycle",
      value: `${avgCycle}d`,
      sub: "length",
      accent: "hsl(215,60%,55%)",
      bg: "hsl(215,60%,97%)",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {cards.map(({ label, value, sub, accent, bg }) => (
        <div key={label} style={{ background: bg, borderRadius: 16, padding: "12px 8px", textAlign: "center" }}>
          <p style={{ fontSize: 9, fontWeight: 700, fontFamily: C.font, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            {label}
          </p>
          <p style={{ fontSize: 16, fontWeight: 800, fontFamily: C.font, color: accent, lineHeight: 1 }}>
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: 10, fontWeight: 600, fontFamily: C.font, color: C.textMid, marginTop: 3 }}>
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
  logs: PeriodLog[];
  onEdit: (log: PeriodLog) => void;
  onDelete: (id: string) => void;
}) => {
  const sorted = [...logs].sort((a, b) => b.startDate.localeCompare(a.startDate));

  if (!sorted.length) return null;

  return (
    <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <p style={{ padding: "14px 16px 8px", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        History
      </p>
      {sorted.map((log, i) => {
        const start    = parseISO(log.startDate);
        const end      = log.endDate ? parseISO(log.endDate) : null;
        const duration = end ? differenceInCalendarDays(end, start) + 1 : null;
        const isLast   = i === sorted.length - 1;

        return (
          <div key={log.id} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: log.endDate ? C.periodBg : C.ovulation, marginRight: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, fontFamily: C.font, color: C.textMain, lineHeight: 1.2 }}>
                {format(start, "MMM d, yyyy")}
                {end && ` – ${format(end, "MMM d")}`}
              </p>
              <p style={{ fontSize: 11, fontFamily: C.font, color: C.textLight, marginTop: 1 }}>
                {log.endDate
                  ? `${duration} day${duration !== 1 ? "s" : ""}`
                  : "Ongoing"}
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
                style={{ width: 30, height: 30, borderRadius: 10, border: "none", background: "hsl(350,80%,96%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
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
   ONBOARDING
═══════════════════════════════════════════════════════════════════ */
const Onboarding = ({ onSave }: { onSave: () => void }) => {
  const [lastDate, setLastDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cycle,    setCycle]    = useState("28");

  function handleSave() {
    const logs: PeriodLog[] = [
      { id: Date.now().toString(), startDate: lastDate, endDate: null },
    ];
    saveLogs(logs);
    localStorage.setItem(LS.CYCLE,  cycle);
    localStorage.setItem(LS.SETUP, "true");
    onSave();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 14, padding: "13px 14px",
    fontSize: 14, fontFamily: C.font, fontWeight: 600,
    color: C.textMain, background: C.bg,
    border: `1.5px solid ${C.border}`, outline: "none",
    WebkitAppearance: "none",
  };

  return (
    <div style={{ padding: "8px 0 8px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <HeartPhoto size={56} />
        <p style={{ marginTop: 14, fontSize: 18, fontWeight: 800, fontFamily: C.font, color: C.textMain }}>
          Let's get started ✨
        </p>
        <p style={{ marginTop: 6, fontSize: 13, fontFamily: C.font, color: C.textMid, lineHeight: 1.5 }}>
          A little info to get personalised predictions
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            First day of last period
          </label>
          <input
            data-testid="input-last-period-date"
            type="date"
            value={lastDate}
            max={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => setLastDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, fontFamily: C.font, color: C.textMid, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Average cycle length (days)
          </label>
          <input
            data-testid="input-cycle-length"
            type="number"
            min={21} max={45}
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            style={inputStyle}
          />
          <p style={{ marginTop: 5, fontSize: 11, fontFamily: C.font, color: C.textLight }}>
            Typically 21–35 days. Default is 28.
          </p>
        </div>
      </div>

      <button
        data-testid="button-period-setup-save"
        onClick={handleSave}
        style={{
          width: "100%", padding: "16px", borderRadius: 18, border: "none",
          background: `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,52%) 100%)`,
          color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: C.font,
          cursor: "pointer", boxShadow: `0 6px 20px hsl(350 65% 55% / 0.3)`,
        }}
      >
        Continue
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN PERIOD TRACKER
═══════════════════════════════════════════════════════════════════ */
interface ModalState {
  open: boolean;
  mode: "add" | "edit";
  editingId: string | null;
  initialStart: string;
  initialEnd: string | null;
}

const PeriodTracker = () => {
  const [setupDone, setSetupDone] = useState(
    () => localStorage.getItem(LS.SETUP) === "true"
  );
  const [logs,         setLogs]         = useState<PeriodLog[]>(loadLogs);
  const [storedCycle,  setStoredCycle]  = useState(loadStoredCycle);
  const [calMonth,     setCalMonth]     = useState(() => new Date());
  const [showHistory,  setShowHistory]  = useState(false);
  const [modal, setModal] = useState<ModalState>({
    open: false, mode: "add", editingId: null,
    initialStart: format(new Date(), "yyyy-MM-dd"), initialEnd: null,
  });

  /* ── Derived ── */
  const avgCycle    = useMemo(() => computeAvgCycle(logs, storedCycle), [logs, storedCycle]);
  const loggedDays  = useMemo(() => getLoggedDays(logs), [logs]);
  const prediction  = useMemo(() => getPrediction(logs, avgCycle), [logs, avgCycle]);

  const daysUntilNext = prediction
    ? differenceInCalendarDays(prediction.nextStart, new Date())
    : null;

  /* ── Log helpers ── */
  function persist(updated: PeriodLog[]) {
    saveLogs(updated);
    setLogs(updated);
  }

  function openAdd() {
    const today = format(new Date(), "yyyy-MM-dd");
    // Check if today is already logged
    const alreadyLogged = logs.some(l => l.startDate === today);
    if (alreadyLogged) return;
    setModal({ open: true, mode: "add", editingId: null, initialStart: today, initialEnd: null });
  }

  function openEdit(log: PeriodLog) {
    setModal({ open: true, mode: "edit", editingId: log.id, initialStart: log.startDate, initialEnd: log.endDate });
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
    setLogs([]); setStoredCycle(28); setSetupDone(false);
  }

  /* ── Active period check ── */
  const activeLog = logs.find(l => l.endDate === null);

  /* ── Render ── */
  return (
    <div style={{ fontFamily: C.font, background: C.bg, minHeight: "100%", position: "relative" }}>

      {/* ── Onboarding ── */}
      {!setupDone && (
        <Onboarding onSave={() => { setLogs(loadLogs()); setSetupDone(true); }} />
      )}

      {/* ── Main app ── */}
      {setupDone && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 96 }}>

          {/* Summary row */}
          <SummaryRow
            daysUntilNext={daysUntilNext}
            nextStart={prediction?.nextStart ?? null}
            ovulation={prediction?.ovulation ?? null}
            avgCycle={avgCycle}
          />

          {/* Active period banner */}
          {activeLog && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "hsl(350,75%,96%)",
                border: `1px solid hsl(350,65%,87%)`,
                borderRadius: 16, padding: "12px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
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
                  padding: "6px 14px", borderRadius: 99, border: "none",
                  background: C.period, color: "#fff",
                  fontSize: 12, fontWeight: 700, fontFamily: C.font, cursor: "pointer",
                }}
              >
                End today
              </button>
            </motion.div>
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
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <HistoryList logs={logs} onEdit={openEdit} onDelete={handleDelete} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset button */}
          <button
            data-testid="button-cycle-reset"
            onClick={handleReset}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px 0",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <RotateCcw size={12} color={C.textLight} />
            <span style={{ fontSize: 11, fontFamily: C.font, color: C.textLight }}>Reset all data</span>
          </button>
        </div>
      )}

      {/* ── FAB ── */}
      {setupDone && (
        <motion.button
          data-testid="button-period-fab"
          onClick={openAdd}
          whileTap={{ scale: 0.92 }}
          style={{
            position: "absolute", bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            padding: "14px 32px",
            borderRadius: 99, border: "none",
            background: `linear-gradient(135deg, ${C.period} 0%, hsl(340,70%,52%) 100%)`,
            color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: C.font,
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer",
            boxShadow: `0 8px 24px hsl(350 65% 55% / 0.36)`,
          }}
        >
          <Plus size={17} strokeWidth={3} />
          Log cycle
        </motion.button>
      )}

      {/* ── Log modal (portal) ── */}
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

export default PeriodTracker;
