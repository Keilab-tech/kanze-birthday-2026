/* ── Birthday detection utility ─────────────────────────────────
   Kanze's birthday: March 29 (month index 2).
   Born: 29 March 2005  →  turning 21 in 2026, 22 in 2027, etc.
──────────────────────────────────────────────────────────────── */

export const BIRTHDAY_MONTH = 2;   // March (0-indexed)
export const BIRTHDAY_DAY   = 29;
export const BIRTH_YEAR     = 2005;

/* ── TEST MODE ───────────────────────────────────────────────────
   Set TEST_MODE = true to simulate the birthday arriving in
   TEST_MINUTES_FROM_NOW minutes.
   Flip back to false before deploying.
──────────────────────────────────────────────────────────────── */
const TEST_MODE             = true;
const TEST_MINUTES_FROM_NOW = 2;

const TEST_BIRTHDAY_TARGET  = Date.now() + TEST_MINUTES_FROM_NOW * 60 * 1000;
const TEST_BIRTHDAY_END     = TEST_BIRTHDAY_TARGET + 24 * 60 * 60 * 1000;

/* ── Core time helpers ─────────────────────────────────────────── */

/** Midnight on this year's birthday. */
function thisYearBirthdayStart(): Date {
  return new Date(new Date().getFullYear(), BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0, 0);
}

/** Midnight on the day after this year's birthday (birthday window end). */
function thisYearBirthdayEnd(): Date {
  const d = thisYearBirthdayStart();
  d.setDate(d.getDate() + 1);
  return d;
}

/* ── Public API ─────────────────────────────────────────────────── */

/** True while the birthday is still in the future (lockscreen phase). */
export function isBirthdayAhead(): boolean {
  if (TEST_MODE) return Date.now() < TEST_BIRTHDAY_TARGET;
  return new Date() < thisYearBirthdayStart();
}

/** True for the full 24-hour birthday window (candle / party phase). */
export function isBirthdayToday(): boolean {
  if (TEST_MODE) {
    const now = Date.now();
    return now >= TEST_BIRTHDAY_TARGET && now < TEST_BIRTHDAY_END;
  }
  const now = new Date();
  return now >= thisYearBirthdayStart() && now < thisYearBirthdayEnd();
}

/** True once the birthday has fully passed for this year. */
export function isBirthdayOver(): boolean {
  if (TEST_MODE) return Date.now() >= TEST_BIRTHDAY_END;
  return new Date() >= thisYearBirthdayEnd();
}

/**
 * The Date of the NEXT upcoming birthday start.
 * - Before birthday  → this year's birthday
 * - During / after   → next year's birthday
 */
export function getNextBirthday(): Date {
  if (TEST_MODE) {
    return Date.now() < TEST_BIRTHDAY_TARGET
      ? new Date(TEST_BIRTHDAY_TARGET)
      : new Date(TEST_BIRTHDAY_END);
  }
  if (isBirthdayAhead()) return thisYearBirthdayStart();
  return new Date(
    new Date().getFullYear() + 1,
    BIRTHDAY_MONTH,
    BIRTHDAY_DAY,
    0, 0, 0, 0
  );
}

/** Age Kanze will turn at the next birthday. */
export function getNextBirthdayAge(): number {
  if (TEST_MODE) return 21;
  return getNextBirthday().getFullYear() - BIRTH_YEAR;
}

/** Ordinal suffix: 21 → "21st", 22 → "22nd", etc. */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
