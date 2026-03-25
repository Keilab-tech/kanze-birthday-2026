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
const TEST_MODE             = false;
const TEST_MINUTES_FROM_NOW = 5;

// Fixed timestamp computed once when the module loads
const TEST_BIRTHDAY_TARGET  = Date.now() + TEST_MINUTES_FROM_NOW * 60 * 1000;
// Birthday "window" lasts 24 h after the target
const TEST_BIRTHDAY_END     = TEST_BIRTHDAY_TARGET + 24 * 60 * 60 * 1000;

/** True for the 24-hour birthday window. */
export function isBirthdayToday(): boolean {
  if (TEST_MODE) {
    const now = Date.now();
    return now >= TEST_BIRTHDAY_TARGET && now < TEST_BIRTHDAY_END;
  }
  const now = new Date();
  return now.getMonth() === BIRTHDAY_MONTH && now.getDate() === BIRTHDAY_DAY;
}

/**
 * Returns the Date of the NEXT upcoming birthday.
 * - Before the birthday → the birthday start time
 * - During the birthday window → the following year's birthday
 * - After the birthday → the following year's birthday
 */
export function getNextBirthday(): Date {
  if (TEST_MODE) {
    const now = Date.now();
    if (now < TEST_BIRTHDAY_TARGET) {
      return new Date(TEST_BIRTHDAY_TARGET);
    }
    // Already in or past the birthday window — next is 24 h later (simulates next year)
    return new Date(TEST_BIRTHDAY_END);
  }
  const now = new Date();
  const year = now.getFullYear();
  const thisYearBD = new Date(year, BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0, 0);
  if (now < thisYearBD && !isBirthdayToday()) {
    return thisYearBD;
  }
  return new Date(year + 1, BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0, 0);
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
