import { useState, useMemo } from "react";
import {
  format,
  addDays,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  parseISO,
  isToday,
  isBefore,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Settings, X, DropletIcon } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────── */
interface PeriodLog {
  id: string;
  startDate: string;
  endDate: string | null;
}

const LS = {
  SETUP: "kanze-period-setup-done",
  LOGS: "kanze-period-logs",
  CYCLE: "kanze-cycle-length",
  PERIOD_LEN: "kanze-period-length",
};

const PHASES = {
  menstruation: {
    label: "Menstruation",
    short: "Period",
    color: "#d94f6e",
    light: "#fde8ee",
    trackColor: "#e87a94",
    emoji: "🌸",
    tip: "Rest, hydrate, and be kind to yourself.",
  },
  follicular: {
    label: "Follicular",
    short: "Pre-Ovulation",
    color: "#2a9d8f",
    light: "#e0f4f1",
    trackColor: "#4bbfb3",
    emoji: "🌱",
    tip: "Energy is rising — great time to start new things.",
  },
  ovulation: {
    label: "Ovulation",
    short: "Peak Fertility",
    color: "#e9a328",
    light: "#fef5e4",
    trackColor: "#f0bb5c",
    emoji: "✨",
    tip: "You're at your most vibrant and social peak.",
  },
  luteal: {
    label: "Luteal",
    short: "Pre-Period",
    color: "#8b67c8",
    light: "#f0ebfa",
    trackColor: "#a98de0",
    emoji: "🌙",
    tip: "Wind down, nourish yourself, and rest up.",
  },
} as const;

type PhaseName = keyof typeof PHASES;

/* ─────────────────────────────────────────────────────────────────
   STORAGE
───────────────────────────────────────────────────────────────── */
function loadLogs(): PeriodLog[] {
  try { return JSON.parse(localStorage.getItem(LS.LOGS) ?? "[]"); }
  catch { return []; }
}
function saveLogs(logs: PeriodLog[]) {
  localStorage.setItem(LS.LOGS, JSON.stringify(logs));
}
function loadCycleLength() {
  const v = parseInt(localStorage.getItem(LS.CYCLE) ?? "28", 10);
  return isNaN(v) ? 28 : v;
}
function loadPeriodLength() {
  const v = parseInt(localStorage.getItem(LS.PERIOD_LEN) ?? "5", 10);
  return isNaN(v) ? 5 : v;
}

/* ─────────────────────────────────────────────────────────────────
   CALCULATION HELPERS
───────────────────────────────────────────────────────────────── */
function sortedLogs(logs: PeriodLog[]) {
  return [...logs].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

function getPhase(cycleDay: number, cycleLen: number, periodLen: number): PhaseName {
  if (cycleDay <= periodLen) return "menstruation";
  if (cycleDay <= cycleLen - 15) return "follicular";
  if (cycleDay <= cycleLen - 12) return "ovulation";
  return "luteal";
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

function getAveragePeriodLength(logs: PeriodLog[]): number {
  const completed = logs.filter((l) => l.endDate);
  if (!completed.length) return 5;
  const total = completed.reduce((sum, l) => {
    const dur = differenceInCalendarDays(parseISO(l.endDate!), parseISO(l.startDate)) + 1;
    return sum + dur;
  }, 0);
  return Math.round(total / completed.length);
}

/* ─────────────────────────────────────────────────────────────────
   CYCLE RING (SVG)
───────────────────────────────────────────────────────────────── */
function CycleRing({
  cycleDay,
  cycleLen,
  periodLen,
  phase,
}: {
  cycleDay: number;
  cycleLen: number;
  periodLen: number;
  phase: PhaseName;
}) {
  const r = 68;
  const cx = 90;
  const cy = 90;
  const C = 2 * Math.PI * r; // 427.26

  // Phase background arc fractions — sum must equal cycleLen exactly
  const follicularLen = Math.max(cycleLen - 15 - periodLen, 1);
  const lutealLen = Math.max(cycleLen - periodLen - follicularLen - 3, 1);
  const phaseFracs = [
    { key: "menstruation" as PhaseName, len: periodLen },
    { key: "follicular" as PhaseName, len: follicularLen },
    { key: "ovulation" as PhaseName, len: 3 },
    { key: "luteal" as PhaseName, len: lutealLen },
  ];

  // Normalise so fractions sum to 1
  const total = phaseFracs.reduce((s, p) => s + p.len, 0);

  // Progress arc
  const progress = Math.min(cycleDay / cycleLen, 1);
  const progressLen = progress * C;

  // Phase color for the active phase
  const ph = PHASES[phase];

  return (
    <svg viewBox="0 0 180 180" width="180" height="180" style={{ overflow: "visible" }}>
      {/* Phase background arcs */}
      {(() => {
        let offsetFrac = 0;
        return phaseFracs.map((seg) => {
          const frac = seg.len / total;
          const arcLen = frac * C;
          const offset = -offsetFrac * C;
          offsetFrac += frac;
          return (
            <circle
              key={seg.key}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={PHASES[seg.key].trackColor}
              strokeWidth={14}
              strokeDasharray={`${arcLen} ${C}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              opacity={0.18}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        });
      })()}

      {/* Track (faint full ring) */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#f0e8ee"
        strokeWidth={14}
      />

      {/* Progress arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={ph.color}
        strokeWidth={14}
        strokeDasharray={`${progressLen} ${C - progressLen}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 6px ${ph.color}55)` }}
      />

      {/* Center: day number */}
      <text
        x={cx} y={cy - 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontFamily="Quicksand, sans-serif"
        fontWeight="600"
        fill="#b07090"
      >
        day
      </text>
      <text
        x={cx} y={cy + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="38"
        fontFamily="Quicksand, sans-serif"
        fontWeight="700"
        fill={ph.color}
      >
        {cycleDay}
      </text>
      <text
        x={cx} y={cy + 34}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontFamily="Quicksand, sans-serif"
        fontWeight="600"
        fill="#c090a0"
      >
        of {cycleLen}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PHASE BAR
───────────────────────────────────────────────────────────────── */
function PhaseBar({ cycleDay, cycleLen, periodLen }: {
  cycleDay: number; cycleLen: number; periodLen: number;
}) {
  const follicularLen = Math.max(cycleLen - 15 - periodLen, 1);
  const lutealLen = Math.max(cycleLen - periodLen - follicularLen - 3, 1);
  const segments = [
    { key: "menstruation" as PhaseName, len: periodLen },
    { key: "follicular" as PhaseName, len: follicularLen },
    { key: "ovulation" as PhaseName, len: 3 },
    { key: "luteal" as PhaseName, len: lutealLen },
  ];
  const total = segments.reduce((s, p) => s + p.len, 0);

  let startDay = 1;
  return (
    <div className="w-full flex rounded-full overflow-hidden h-2.5 gap-px">
      {segments.map((seg) => {
        const isActive = cycleDay >= startDay && cycleDay < startDay + seg.len;
        const width = (seg.len / total) * 100;
        startDay += seg.len;
        return (
          <div
            key={seg.key}
            style={{
              width: `${width}%`,
              background: PHASES[seg.key].color,
              opacity: isActive ? 1 : 0.3,
              transition: "opacity 0.3s",
            }}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="flex-1 rounded-2xl px-3 py-3 flex flex-col items-center gap-0.5"
      style={{
        background: "hsl(0 0% 100% / 0.7)",
        border: "1px solid hsl(340, 40%, 90%)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <span
        className="text-[19px] font-bold leading-none"
        style={{ color: "hsl(340, 55%, 38%)", fontFamily: "'Quicksand', sans-serif" }}
      >
        {value}
      </span>
      {sub && (
        <span
          className="text-[9px] leading-none"
          style={{ color: "hsl(340, 35%, 60%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          {sub}
        </span>
      )}
      <span
        className="text-[10px] font-semibold mt-0.5 text-center leading-tight"
        style={{ color: "hsl(340, 25%, 58%)", fontFamily: "'Quicksand', sans-serif" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CALENDAR
───────────────────────────────────────────────────────────────── */
function MonthCalendar({
  month, loggedDays, predictedDays, fertileWindow, ovulationDay, onPrev, onNext,
}: {
  month: Date;
  loggedDays: Date[];
  predictedDays: Date[];
  fertileWindow: Date[];
  ovulationDay: Date | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "hsl(0 0% 100% / 0.72)", border: "1px solid hsl(340, 35%, 90%)" }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          data-testid="button-calendar-prev-month"
          onClick={onPrev}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "hsl(340 45% 93%)", color: "hsl(340, 55%, 52%)" }}
        >
          <ChevronLeft size={15} />
        </button>
        <span
          className="text-sm font-bold"
          style={{ color: "hsl(340, 40%, 32%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          {format(month, "MMMM yyyy")}
        </span>
        <button
          data-testid="button-calendar-next-month"
          onClick={onNext}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "hsl(340 45% 93%)", color: "hsl(340, 55%, 52%)" }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold py-1"
            style={{ color: "hsl(340, 30%, 62%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {allDays.map((day) => {
          const inMonth = isSameMonth(day, month);
          const logged = loggedDays.some((ld) => isSameDay(ld, day));
          const predicted = predictedDays.some((pd) => isSameDay(pd, day));
          const fertile = fertileWindow.some((fd) => isSameDay(fd, day));
          const isOvulation = ovulationDay ? isSameDay(day, ovulationDay) : false;
          const today = isToday(day);

          let bg = "transparent";
          let textColor = inMonth ? "hsl(340, 30%, 38%)" : "hsl(340, 15%, 80%)";
          let fontWeight: number = 400;
          let outline = "none";
          let dotColor = "";

          if (logged) {
            bg = "#d94f6e";
            textColor = "white";
            fontWeight = 700;
          } else if (predicted) {
            bg = "#fde8ee";
            textColor = "#c05070";
            fontWeight = 600;
            outline = "1.5px dashed #e87a94";
          } else if (isOvulation && inMonth) {
            bg = "#fef5e4";
            textColor = "#c08020";
            fontWeight = 700;
            dotColor = "#e9a328";
          } else if (fertile && inMonth) {
            bg = "#fffbf0";
            textColor = "#b09040";
            fontWeight = 500;
          } else if (today && inMonth) {
            outline = "2px solid #d94f6e";
            textColor = "#d94f6e";
            fontWeight = 700;
          }

          return (
            <div
              key={day.toISOString()}
              className="flex items-center justify-center relative"
              style={{ height: 34 }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] relative"
                style={{ background: bg, color: textColor, fontWeight, outline, outlineOffset: 1,
                  fontFamily: "'Quicksand', sans-serif" }}
              >
                {format(day, "d")}
                {dotColor && (
                  <div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: dotColor }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 justify-center">
        {[
          { color: "#d94f6e", label: "Period", type: "solid" },
          { color: "#e87a94", label: "Predicted", type: "dashed" },
          { color: "#e9a328", label: "Ovulation", type: "dot" },
          { color: "#f0bb5c", label: "Fertile", type: "solid" },
        ].map(({ color, label, type }) => (
          <div key={label} className="flex items-center gap-1">
            {type === "dot" ? (
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            ) : (
              <div
                className="w-4 h-2.5 rounded-sm"
                style={{
                  background: type === "dashed" ? "#fde8ee" : label === "Fertile" ? "#fffbf0" : color,
                  border: type === "dashed" ? `1px dashed ${color}` : "none",
                }}
              />
            )}
            <span className="text-[9px]" style={{ color: "#b090a0", fontFamily: "'Quicksand', sans-serif" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PERIOD HISTORY
───────────────────────────────────────────────────────────────── */
function PeriodHistory({ logs }: { logs: PeriodLog[] }) {
  const recent = sortedLogs(logs).slice(0, 4);
  if (!recent.length) return null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "hsl(0 0% 100% / 0.72)", border: "1px solid hsl(340, 35%, 90%)" }}
    >
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: "hsl(340, 35%, 55%)", fontFamily: "'Quicksand', sans-serif" }}
      >
        Period History
      </p>
      <div className="flex flex-col gap-2">
        {recent.map((log, i) => {
          const start = parseISO(log.startDate);
          const end = log.endDate ? parseISO(log.endDate) : null;
          const dur = end ? differenceInCalendarDays(end, start) + 1 : null;
          return (
            <div key={log.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: i === 0 ? "#d94f6e" : "#e8a0b0" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "hsl(340, 35%, 35%)", fontFamily: "'Quicksand', sans-serif" }}
                >
                  {format(start, "MMM d, yyyy")}
                </span>
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: log.endDate === null ? "#fde8ee" : "hsl(340, 30%, 93%)",
                  color: log.endDate === null ? "#d94f6e" : "hsl(340, 30%, 52%)",
                  fontFamily: "'Quicksand', sans-serif",
                }}
              >
                {log.endDate === null ? "ongoing" : `${dur} day${dur !== 1 ? "s" : ""}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ONBOARDING
───────────────────────────────────────────────────────────────── */
function Onboarding({ onSave }: { onSave: () => void }) {
  const [lastDate, setLastDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cycle, setCycle] = useState("28");
  const [periodLen, setPeriodLen] = useState("5");

  function handleSave() {
    const logs: PeriodLog[] = [
      { id: Date.now().toString(), startDate: lastDate, endDate: null },
    ];
    saveLogs(logs);
    localStorage.setItem(LS.CYCLE, cycle);
    localStorage.setItem(LS.PERIOD_LEN, periodLen);
    localStorage.setItem(LS.SETUP, "true");
    onSave();
  }

  const inputStyle = {
    background: "hsl(0 0% 100% / 0.8)",
    border: "1.5px solid hsl(340, 40%, 84%)",
    color: "hsl(340, 35%, 28%)",
    fontFamily: "'Quicksand', sans-serif",
    borderRadius: 14,
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "hsl(0 0% 100% / 0.72)", border: "1px solid hsl(340, 35%, 90%)" }}
    >
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #e87a94 0%, #d94f6e 100%)",
            boxShadow: "0 6px 24px #d94f6e44" }}
        >
          <DropletIcon size={28} color="white" />
        </div>
      </div>

      <div className="text-center mb-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
          style={{ color: "#d94f6e", fontFamily: "'Quicksand', sans-serif" }}
        >
          Quick Setup
        </p>
        <p
          className="text-sm leading-relaxed font-medium"
          style={{ color: "hsl(340, 25%, 40%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          Hey Kanze, tell me a bit more so I can predict your next period ✨
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div>
          <label
            className="block text-xs font-bold mb-1.5 ml-1"
            style={{ color: "hsl(340, 40%, 42%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            First day of last period
          </label>
          <input
            data-testid="input-last-period-date"
            type="date"
            value={lastDate}
            max={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => setLastDate(e.target.value)}
            className="w-full px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-xs font-bold mb-1.5 ml-1"
              style={{ color: "hsl(340, 40%, 42%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              Cycle length (days)
            </label>
            <input
              data-testid="input-cycle-length"
              type="number" min={21} max={45} value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              className="block text-xs font-bold mb-1.5 ml-1"
              style={{ color: "hsl(340, 40%, 42%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              Period duration
            </label>
            <input
              data-testid="input-period-length"
              type="number" min={2} max={10} value={periodLen}
              onChange={(e) => setPeriodLen(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <button
        data-testid="button-period-setup-save"
        onClick={handleSave}
        className="w-full py-3.5 text-sm font-bold rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #e87a94 0%, #d94f6e 100%)",
          color: "white",
          fontFamily: "'Quicksand', sans-serif",
          boxShadow: "0 6px 20px #d94f6e44",
          letterSpacing: "0.03em",
        }}
      >
        Get Started ✨
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SETTINGS
───────────────────────────────────────────────────────────────── */
function SettingsPanel({
  cycleLength, periodLength, onSave, onReset, onClose,
}: {
  cycleLength: number; periodLength: number;
  onSave: (c: number, p: number) => void;
  onReset: () => void; onClose: () => void;
}) {
  const [cycle, setCycle] = useState(cycleLength.toString());
  const [period, setPeriod] = useState(periodLength.toString());

  function save() {
    const c = parseInt(cycle, 10);
    const p = parseInt(period, 10);
    if (!isNaN(c) && c >= 21 && c <= 45 && !isNaN(p) && p >= 2 && p <= 10) {
      onSave(c, p);
    }
    onClose();
  }

  const inputStyle = {
    background: "hsl(0 0% 100% / 0.8)",
    border: "1.5px solid hsl(340, 40%, 84%)",
    color: "hsl(340, 35%, 28%)",
    fontFamily: "'Quicksand', sans-serif",
    borderRadius: 14,
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "hsl(0 0% 100% / 0.72)", border: "1px solid hsl(340, 35%, 90%)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold" style={{ color: "hsl(340,40%,32%)", fontFamily: "'Quicksand', sans-serif" }}>
          Settings
        </p>
        <button
          data-testid="button-period-settings-close"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "hsl(340, 35%, 92%)", color: "hsl(340, 50%, 48%)" }}
        >
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 ml-1" style={{ color: "hsl(340,40%,42%)", fontFamily: "'Quicksand', sans-serif" }}>
            Cycle length
          </label>
          <input type="number" min={21} max={45} value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            data-testid="input-settings-cycle-length"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 ml-1" style={{ color: "hsl(340,40%,42%)", fontFamily: "'Quicksand', sans-serif" }}>
            Period length
          </label>
          <input type="number" min={2} max={10} value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            data-testid="input-settings-period-length"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          data-testid="button-settings-save"
          onClick={save}
          className="flex-1 rounded-xl py-3 text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #e87a94 0%, #d94f6e 100%)", color: "white", fontFamily: "'Quicksand', sans-serif" }}
        >
          Save
        </button>
        <button
          data-testid="button-settings-reset"
          onClick={onReset}
          className="flex-1 rounded-xl py-3 text-sm font-bold"
          style={{ background: "hsl(340 25% 92%)", color: "hsl(340,40%,46%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
const PeriodTracker = () => {
  const [setupDone, setSetupDone] = useState(() => localStorage.getItem(LS.SETUP) === "true");
  const [logs, setLogs] = useState<PeriodLog[]>(loadLogs);
  const [cycleLength, setCycleLength] = useState(loadCycleLength);
  const [periodLength, setPeriodLength] = useState(loadPeriodLength);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [showSettings, setShowSettings] = useState(false);

  /* ── Derived ── */
  const sl = useMemo(() => sortedLogs(logs), [logs]);
  const latestLog = sl[0] ?? null;

  const cycleDay = useMemo(() => {
    if (!latestLog) return 1;
    const diff = differenceInCalendarDays(new Date(), parseISO(latestLog.startDate)) + 1;
    return Math.max(1, Math.min(diff, cycleLength));
  }, [latestLog, cycleLength]);

  const phase = useMemo(
    () => getPhase(cycleDay, cycleLength, periodLength),
    [cycleDay, cycleLength, periodLength]
  );

  const nextPeriodDate = useMemo(() => {
    if (!latestLog) return null;
    return addDays(parseISO(latestLog.startDate), cycleLength);
  }, [latestLog, cycleLength]);

  const daysUntilNext = nextPeriodDate
    ? differenceInCalendarDays(nextPeriodDate, new Date())
    : null;

  const loggedDays = useMemo(() => getLoggedDays(logs), [logs]);

  const predictedDays = useMemo(() => {
    if (!nextPeriodDate) return [];
    if (isBefore(nextPeriodDate, new Date())) return [];
    return Array.from({ length: periodLength }, (_, i) => addDays(nextPeriodDate, i));
  }, [nextPeriodDate, periodLength]);

  // Predicted ovulation of NEXT cycle
  const nextOvulationDay = useMemo(() => {
    if (!nextPeriodDate) return null;
    return addDays(nextPeriodDate, cycleLength - 14);
  }, [nextPeriodDate, cycleLength]);

  // Fertile window: 5 days before ovulation to ovulation day
  const fertileWindow = useMemo(() => {
    if (!nextOvulationDay) return [];
    return Array.from({ length: 6 }, (_, i) => addDays(nextOvulationDay, i - 5));
  }, [nextOvulationDay]);

  const activeLog = logs.find((l) => l.endDate === null);
  const isLogging = !!activeLog;
  const avgPeriodLen = useMemo(() => getAveragePeriodLength(logs), [logs]);
  const ph = PHASES[phase];

  /* ── Handlers ── */
  function handleSetupSave() {
    setLogs(loadLogs());
    setCycleLength(loadCycleLength());
    setPeriodLength(loadPeriodLength());
    setSetupDone(true);
  }

  function toggleLog() {
    if (isLogging) {
      const updated = logs.map((l) =>
        l.id === activeLog!.id ? { ...l, endDate: format(new Date(), "yyyy-MM-dd") } : l
      );
      saveLogs(updated); setLogs(updated);
    } else {
      const newLog: PeriodLog = {
        id: Date.now().toString(),
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: null,
      };
      const updated = [...logs, newLog];
      saveLogs(updated); setLogs(updated);
    }
  }

  function handleSettingsSave(c: number, p: number) {
    localStorage.setItem(LS.CYCLE, c.toString());
    localStorage.setItem(LS.PERIOD_LEN, p.toString());
    setCycleLength(c); setPeriodLength(p);
  }

  function handleReset() {
    if (!confirm("Reset all cycle data? This can't be undone.")) return;
    [LS.SETUP, LS.LOGS, LS.CYCLE, LS.PERIOD_LEN].forEach((k) => localStorage.removeItem(k));
    setLogs([]); setCycleLength(28); setPeriodLength(5);
    setSetupDone(false); setShowSettings(false);
  }

  /* ── Onboarding ── */
  if (!setupDone) return <Onboarding onSave={handleSetupSave} />;

  /* ── Settings ── */
  if (showSettings) return (
    <SettingsPanel
      cycleLength={cycleLength}
      periodLength={periodLength}
      onSave={handleSettingsSave}
      onReset={handleReset}
      onClose={() => setShowSettings(false)}
    />
  );

  /* ── Dashboard ── */
  return (
    <div className="flex flex-col gap-4">

      {/* ── Cycle ring + phase info ── */}
      <div
        className="rounded-2xl px-5 py-5 flex flex-col items-center"
        style={{
          background: "hsl(0 0% 100% / 0.72)",
          border: "1px solid hsl(340, 35%, 90%)",
        }}
      >
        {/* Top row: settings gear */}
        <div className="w-full flex justify-end mb-1">
          <button
            data-testid="button-period-settings-open"
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(340 35% 93%)", color: "hsl(340, 45%, 52%)" }}
          >
            <Settings size={14} />
          </button>
        </div>

        <CycleRing cycleDay={cycleDay} cycleLen={cycleLength} periodLen={periodLength} phase={phase} />

        {/* Phase label */}
        <div
          className="mt-3 px-5 py-2 rounded-full flex items-center gap-2"
          style={{ background: ph.light }}
        >
          <span style={{ fontSize: 16 }}>{ph.emoji}</span>
          <div>
            <span
              className="text-sm font-bold"
              style={{ color: ph.color, fontFamily: "'Quicksand', sans-serif" }}
            >
              {ph.label}
            </span>
            <span
              className="text-[11px] font-medium ml-1.5"
              style={{ color: ph.color + "bb", fontFamily: "'Quicksand', sans-serif" }}
            >
              · {ph.short}
            </span>
          </div>
        </div>

        {/* Phase tip */}
        <p
          className="text-[11px] text-center mt-2.5 leading-relaxed max-w-xs"
          style={{ color: "hsl(340, 25%, 52%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          {ph.tip}
        </p>

        {/* Phase bar */}
        <div className="w-full mt-3">
          <PhaseBar cycleDay={cycleDay} cycleLen={cycleLength} periodLen={periodLength} />
          <div className="flex justify-between mt-1">
            {(["menstruation", "follicular", "ovulation", "luteal"] as PhaseName[]).map((p) => (
              <span
                key={p}
                className="text-[8px] font-bold"
                style={{ color: PHASES[p].color, opacity: phase === p ? 1 : 0.4,
                  fontFamily: "'Quicksand', sans-serif" }}
              >
                {p === "menstruation" ? "Period" : p === "follicular" ? "Follicular" :
                  p === "ovulation" ? "Ovulation" : "Luteal"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex gap-2.5">
        <StatCard
          label="Cycle Length"
          value={`${cycleLength}d`}
        />
        <StatCard
          label="Avg Period"
          value={`${avgPeriodLen}d`}
        />
        <StatCard
          label={daysUntilNext !== null && daysUntilNext < 0 ? "Overdue" : "Next Period"}
          value={
            daysUntilNext === null ? "—"
            : daysUntilNext === 0 ? "Today"
            : daysUntilNext < 0 ? `${Math.abs(daysUntilNext)}d ago`
            : `${daysUntilNext}d`
          }
          sub={nextPeriodDate ? format(nextPeriodDate, "MMM d") : undefined}
        />
      </div>

      {/* ── Log button ── */}
      <button
        data-testid="button-period-log-toggle"
        onClick={toggleLog}
        className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
        style={
          isLogging
            ? {
                background: "hsl(0 0% 100% / 0.72)",
                color: "#d94f6e",
                border: "2px solid #e87a94",
                fontFamily: "'Quicksand', sans-serif",
              }
            : {
                background: "linear-gradient(135deg, #e87a94 0%, #d94f6e 100%)",
                color: "white",
                boxShadow: "0 6px 20px #d94f6e44",
                fontFamily: "'Quicksand', sans-serif",
              }
        }
      >
        <DropletIcon size={16} fill={isLogging ? "none" : "white"} />
        {isLogging ? "End Period Today" : "Period Started Today"}
      </button>

      {/* ── Calendar ── */}
      <MonthCalendar
        month={calendarMonth}
        loggedDays={loggedDays}
        predictedDays={predictedDays}
        fertileWindow={fertileWindow}
        ovulationDay={nextOvulationDay}
        onPrev={() => setCalendarMonth((m) => subMonths(m, 1))}
        onNext={() => setCalendarMonth((m) => addMonths(m, 1))}
      />

      {/* ── History ── */}
      <PeriodHistory logs={logs} />
    </div>
  );
};

export default PeriodTracker;
