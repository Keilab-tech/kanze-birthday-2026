import { useState, useCallback, useMemo } from "react";
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
import { ChevronLeft, ChevronRight, Settings, X, Droplets } from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────── */
interface PeriodLog {
  id: string;
  startDate: string; // ISO yyyy-MM-dd
  endDate: string | null;
}

/* ── Storage helpers ─────────────────────────────────────────────── */
const LS = {
  SETUP: "kanze-period-setup-done",
  LOGS: "kanze-period-logs",
  CYCLE: "kanze-cycle-length",
};

function loadLogs(): PeriodLog[] {
  try {
    return JSON.parse(localStorage.getItem(LS.LOGS) ?? "[]");
  } catch {
    return [];
  }
}

function saveLogs(logs: PeriodLog[]) {
  localStorage.setItem(LS.LOGS, JSON.stringify(logs));
}

function loadCycleLength(): number {
  const v = parseInt(localStorage.getItem(LS.CYCLE) ?? "28", 10);
  return isNaN(v) ? 28 : v;
}

/* ── Calculation helpers ─────────────────────────────────────────── */
function getLoggedDays(logs: PeriodLog[]): Date[] {
  const days: Date[] = [];
  for (const log of logs) {
    const start = parseISO(log.startDate);
    const end = log.endDate ? parseISO(log.endDate) : new Date();
    // Safety cap: no more than 10 days per period to avoid bloating if endDate missing
    const cap = Math.min(differenceInCalendarDays(end, start), 9);
    for (let i = 0; i <= cap; i++) days.push(addDays(start, i));
  }
  return days;
}

function getPredictedDays(logs: PeriodLog[], cycleLength: number): Date[] {
  if (!logs.length) return [];
  // Use the most recent start date
  const sortedLogs = [...logs].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1
  );
  const latestStart = parseISO(sortedLogs[0].startDate);
  const predictedStart = addDays(latestStart, cycleLength);
  // Only show prediction if it's in the future
  if (isBefore(predictedStart, new Date())) return [];
  // Predict ~5 days (typical period)
  return Array.from({ length: 5 }, (_, i) => addDays(predictedStart, i));
}

function getNextPeriodDate(
  logs: PeriodLog[],
  cycleLength: number
): Date | null {
  if (!logs.length) return null;
  const sorted = [...logs].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1
  );
  return addDays(parseISO(sorted[0].startDate), cycleLength);
}

/* ── Onboarding ──────────────────────────────────────────────────── */
function Onboarding({ onSave }: { onSave: () => void }) {
  const [lastDate, setLastDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cycle, setCycle] = useState("28");

  function handleSave() {
    const logs: PeriodLog[] = [
      { id: Date.now().toString(), startDate: lastDate, endDate: null },
    ];
    saveLogs(logs);
    localStorage.setItem(LS.CYCLE, cycle);
    localStorage.setItem(LS.SETUP, "true");
    onSave();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-1">
        <p
          className="text-xs font-semibold uppercase tracking-[0.18em] mb-1"
          style={{ color: "hsl(340, 55%, 60%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          quick setup
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "hsl(340, 25%, 45%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          Tell me a bit so I can predict your next period ✨
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "hsl(340, 45%, 40%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            First day of your last period
          </label>
          <input
            data-testid="input-last-period-date"
            type="date"
            value={lastDate}
            max={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => setLastDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: "hsl(340 60% 97%)",
              border: "1.5px solid hsl(340, 45%, 85%)",
              color: "hsl(340, 35%, 30%)",
              fontFamily: "'Quicksand', sans-serif",
            }}
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "hsl(340, 45%, 40%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Average cycle length (days)
          </label>
          <input
            data-testid="input-cycle-length"
            type="number"
            min={21}
            max={45}
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: "hsl(340 60% 97%)",
              border: "1.5px solid hsl(340, 45%, 85%)",
              color: "hsl(340, 35%, 30%)",
              fontFamily: "'Quicksand', sans-serif",
            }}
          />
        </div>
      </div>

      <button
        data-testid="button-period-setup-save"
        onClick={handleSave}
        className="mt-1 w-full rounded-2xl py-3 text-sm font-semibold"
        style={{
          background: "linear-gradient(135deg, hsl(340,75%,68%) 0%, hsl(350,70%,62%) 100%)",
          color: "white",
          fontFamily: "'Quicksand', sans-serif",
          boxShadow: "0 4px 16px hsl(340 60% 65% / 0.35)",
        }}
      >
        Save &amp; Continue ✨
      </button>
    </div>
  );
}

/* ── Calendar ────────────────────────────────────────────────────── */
function MonthCalendar({
  month,
  loggedDays,
  predictedDays,
  onPrev,
  onNext,
}: {
  month: Date;
  loggedDays: Date[];
  predictedDays: Date[];
  onPrev: () => void;
  onNext: () => void;
}) {
  // Build grid: weeks from start-of-week of month-start to end-of-week of month-end
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const isLogged = useCallback(
    (d: Date) => loggedDays.some((ld) => isSameDay(ld, d)),
    [loggedDays]
  );
  const isPredicted = useCallback(
    (d: Date) => predictedDays.some((pd) => isSameDay(pd, d)),
    [predictedDays]
  );

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          data-testid="button-calendar-prev-month"
          onClick={onPrev}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "hsl(340 50% 94%)", color: "hsl(340, 55%, 55%)" }}
        >
          <ChevronLeft size={15} />
        </button>
        <span
          className="text-sm font-semibold"
          style={{ color: "hsl(340, 40%, 35%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          {format(month, "MMMM yyyy")}
        </span>
        <button
          data-testid="button-calendar-next-month"
          onClick={onNext}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "hsl(340 50% 94%)", color: "hsl(340, 55%, 55%)" }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold py-1"
            style={{ color: "hsl(340, 35%, 62%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {allDays.map((day) => {
          const inMonth = isSameMonth(day, month);
          const logged = isLogged(day);
          const predicted = isPredicted(day);
          const today = isToday(day);

          let bg = "transparent";
          let textColor = inMonth ? "hsl(340, 30%, 40%)" : "hsl(340, 20%, 78%)";
          let fontWeight: "normal" | "bold" | 600 = "normal";

          if (logged) {
            bg = "hsl(340, 72%, 62%)";
            textColor = "white";
            fontWeight = 600;
          } else if (predicted) {
            bg = "hsl(340, 80%, 90%)";
            textColor = "hsl(340, 60%, 52%)";
            fontWeight = 600;
          } else if (today && inMonth) {
            bg = "hsl(340, 40%, 88%)";
            textColor = "hsl(340, 55%, 40%)";
            fontWeight = 600;
          }

          return (
            <div
              key={day.toISOString()}
              className="flex items-center justify-center"
              style={{ height: 32 }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px]"
                style={{
                  background: bg,
                  color: textColor,
                  fontWeight,
                  fontFamily: "'Quicksand', sans-serif",
                  outline: today && inMonth && !logged ? "1.5px solid hsl(340, 65%, 70%)" : "none",
                  outlineOffset: 1,
                }}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "hsl(340, 72%, 62%)" }}
          />
          <span
            className="text-[10px]"
            style={{ color: "hsl(340, 30%, 52%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Period
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "hsl(340, 80%, 90%)", border: "1px solid hsl(340,65%,75%)" }}
          />
          <span
            className="text-[10px]"
            style={{ color: "hsl(340, 30%, 52%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Predicted
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "hsl(340, 40%, 88%)", border: "1px solid hsl(340,55%,70%)" }}
          />
          <span
            className="text-[10px]"
            style={{ color: "hsl(340, 30%, 52%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Today
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Settings panel ──────────────────────────────────────────────── */
function SettingsPanel({
  cycleLength,
  onCycleChange,
  onReset,
  onClose,
}: {
  cycleLength: number;
  onCycleChange: (v: number) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(cycleLength.toString());

  function save() {
    const v = parseInt(draft, 10);
    if (!isNaN(v) && v >= 21 && v <= 45) {
      onCycleChange(v);
    }
    onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-semibold"
          style={{ color: "hsl(340, 45%, 35%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          Settings
        </span>
        <button
          data-testid="button-period-settings-close"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "hsl(340, 40%, 90%)", color: "hsl(340, 50%, 50%)" }}
        >
          <X size={14} />
        </button>
      </div>

      <div>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: "hsl(340, 40%, 45%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          Average cycle length (days)
        </label>
        <input
          data-testid="input-settings-cycle-length"
          type="number"
          min={21}
          max={45}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            background: "hsl(340 60% 97%)",
            border: "1.5px solid hsl(340, 45%, 85%)",
            color: "hsl(340, 35%, 30%)",
            fontFamily: "'Quicksand', sans-serif",
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          data-testid="button-settings-save"
          onClick={save}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, hsl(340,75%,68%) 0%, hsl(350,70%,62%) 100%)",
            color: "white",
            fontFamily: "'Quicksand', sans-serif",
          }}
        >
          Save
        </button>
        <button
          data-testid="button-settings-reset"
          onClick={onReset}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
          style={{
            background: "hsl(340 30% 92%)",
            color: "hsl(340, 45%, 45%)",
            fontFamily: "'Quicksand', sans-serif",
          }}
        >
          Reset all
        </button>
      </div>
    </div>
  );
}

/* ── Main PeriodTracker component ────────────────────────────────── */
const PeriodTracker = () => {
  const [setupDone, setSetupDone] = useState(
    () => localStorage.getItem(LS.SETUP) === "true"
  );
  const [logs, setLogs] = useState<PeriodLog[]>(loadLogs);
  const [cycleLength, setCycleLength] = useState(loadCycleLength);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [showSettings, setShowSettings] = useState(false);

  /* Derived state */
  const loggedDays = useMemo(() => getLoggedDays(logs), [logs]);
  const predictedDays = useMemo(
    () => getPredictedDays(logs, cycleLength),
    [logs, cycleLength]
  );
  const nextPeriodDate = useMemo(
    () => getNextPeriodDate(logs, cycleLength),
    [logs, cycleLength]
  );

  const activeLog = logs.find((l) => l.endDate === null);
  const isLogging = !!activeLog;

  const daysUntilNext = nextPeriodDate
    ? differenceInCalendarDays(nextPeriodDate, new Date())
    : null;

  /* Handlers */
  function handleSetupSave() {
    setLogs(loadLogs());
    setCycleLength(loadCycleLength());
    setSetupDone(true);
  }

  function toggleLog() {
    if (isLogging) {
      // End the active period
      const updated = logs.map((l) =>
        l.id === activeLog!.id
          ? { ...l, endDate: format(new Date(), "yyyy-MM-dd") }
          : l
      );
      saveLogs(updated);
      setLogs(updated);
    } else {
      // Start a new period log
      const newLog: PeriodLog = {
        id: Date.now().toString(),
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: null,
      };
      const updated = [...logs, newLog];
      saveLogs(updated);
      setLogs(updated);
    }
  }

  function handleCycleChange(v: number) {
    localStorage.setItem(LS.CYCLE, v.toString());
    setCycleLength(v);
  }

  function handleReset() {
    if (!confirm("Reset all period data? This can't be undone.")) return;
    localStorage.removeItem(LS.SETUP);
    localStorage.removeItem(LS.LOGS);
    localStorage.removeItem(LS.CYCLE);
    setLogs([]);
    setCycleLength(28);
    setSetupDone(false);
    setShowSettings(false);
  }

  /* ── Render ── */
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "hsl(0 0% 100% / 0.52)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid hsl(0 0% 100% / 0.75)",
        boxShadow: "0 4px 20px hsl(340 60% 70% / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.9)",
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(340,75%,68%) 0%, hsl(350,70%,62%) 100%)",
              boxShadow: "0 3px 10px hsl(340 60% 65% / 0.28)",
            }}
          >
            <Droplets size={14} color="white" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "hsl(340, 40%, 30%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Period Tracker
          </span>
        </div>
        {setupDone && !showSettings && (
          <button
            data-testid="button-period-settings-open"
            onClick={() => setShowSettings(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "hsl(340 40% 92%)", color: "hsl(340, 50%, 52%)" }}
          >
            <Settings size={13} />
          </button>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          cycleLength={cycleLength}
          onCycleChange={handleCycleChange}
          onReset={handleReset}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Onboarding */}
      {!setupDone && !showSettings && (
        <Onboarding onSave={handleSetupSave} />
      )}

      {/* Dashboard */}
      {setupDone && !showSettings && (
        <div className="flex flex-col gap-4">

          {/* Next period header */}
          {nextPeriodDate && (
            <div
              className="rounded-xl px-4 py-3 text-center"
              style={{
                background: daysUntilNext !== null && daysUntilNext <= 3
                  ? "hsl(340, 80%, 96%)"
                  : "hsl(340, 50%, 96%)",
                border: "1px solid hsl(340, 50%, 88%)",
              }}
            >
              {daysUntilNext !== null && daysUntilNext < 0 ? (
                <p
                  className="text-xs font-semibold"
                  style={{ color: "hsl(340, 65%, 52%)", fontFamily: "'Quicksand', sans-serif" }}
                >
                  Period may have started — log it below 💧
                </p>
              ) : (
                <>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-0.5"
                    style={{ color: "hsl(340, 45%, 60%)", fontFamily: "'Quicksand', sans-serif" }}
                  >
                    Next Period
                  </p>
                  <p
                    className="text-base font-bold"
                    style={{ color: "hsl(340, 65%, 45%)", fontFamily: "'Quicksand', sans-serif" }}
                  >
                    {format(nextPeriodDate, "MMMM d")}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "hsl(340, 40%, 58%)", fontFamily: "'Quicksand', sans-serif" }}
                  >
                    {daysUntilNext === 0
                      ? "Today!"
                      : daysUntilNext === 1
                      ? "Tomorrow"
                      : `in ${daysUntilNext} days`}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Log / End toggle button */}
          <button
            data-testid="button-period-log-toggle"
            onClick={toggleLog}
            className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={
              isLogging
                ? {
                    background: "hsl(340 25% 92%)",
                    color: "hsl(340, 50%, 42%)",
                    border: "1.5px solid hsl(340, 45%, 82%)",
                    fontFamily: "'Quicksand', sans-serif",
                  }
                : {
                    background: "linear-gradient(135deg, hsl(340,75%,68%) 0%, hsl(350,70%,62%) 100%)",
                    color: "white",
                    boxShadow: "0 4px 14px hsl(340 60% 65% / 0.32)",
                    fontFamily: "'Quicksand', sans-serif",
                  }
            }
          >
            <Droplets size={15} />
            {isLogging ? "End Period Today" : "Log Period Today"}
          </button>

          {/* Calendar */}
          <div
            className="rounded-xl p-3"
            style={{ background: "hsl(340 50% 99%)", border: "1px solid hsl(340, 40%, 90%)" }}
          >
            <MonthCalendar
              month={calendarMonth}
              loggedDays={loggedDays}
              predictedDays={predictedDays}
              onPrev={() => setCalendarMonth((m) => subMonths(m, 1))}
              onNext={() => setCalendarMonth((m) => addMonths(m, 1))}
            />
          </div>

          {/* Cycle length note */}
          <p
            className="text-center text-[10px]"
            style={{ color: "hsl(340, 30%, 60%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Cycle length: {cycleLength} days · Tap ⚙️ to adjust
          </p>
        </div>
      )}
    </div>
  );
};

export default PeriodTracker;
