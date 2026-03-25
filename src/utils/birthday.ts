/* ── Birthday detection utility ─────────────────────────────────
   Kanze's birthday: March 29 (month index 2).
   Born: 29 March 2005  →  turning 21 in 2026, 22 in 2027, etc.
──────────────────────────────────────────────────────────────── */

export const BIRTHDAY_MONTH = 2;   // March (0-indexed)
export const BIRTHDAY_DAY   = 29;
export const BIRTH_YEAR     = 2005;

function thisYearBirthdayStart(): Date {
  return new Date(new Date().getFullYear(), BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0, 0);
}

function thisYearBirthdayEnd(): Date {
  const d = thisYearBirthdayStart();
  d.setDate(d.getDate() + 1);
  return d;
}

/** True for the full 24-hour birthday window. */
export function isBirthdayToday(): boolean {
  const now = new Date();
  return now >= thisYearBirthdayStart() && now < thisYearBirthdayEnd();
}

/**
 * The Date of the NEXT upcoming birthday start.
 * - Before / on birthday today → next year's birthday
 * - Before this year's birthday → this year's birthday
 */
export function getNextBirthday(): Date {
  const now = new Date();
  if (now < thisYearBirthdayStart()) return thisYearBirthdayStart();
  return new Date(now.getFullYear() + 1, BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0, 0);
}

/** Age Kanze will turn at the next birthday. */
export function getNextBirthdayAge(): number {
  return getNextBirthday().getFullYear() - BIRTH_YEAR;
}

/** Ordinal suffix: 21 → "21st", 22 → "22nd", etc. */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
