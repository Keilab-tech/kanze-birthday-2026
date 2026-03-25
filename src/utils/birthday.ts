/* ── Birthday detection utility ─────────────────────────────────
   Kanze's birthday: March 21 (month index 2).
   Born: 2005  →  turning 21 in 2026, 22 in 2027, etc.
──────────────────────────────────────────────────────────────── */

export const BIRTHDAY_MONTH = 2;   // March (0-indexed)
export const BIRTHDAY_DAY   = 21;
export const BIRTH_YEAR     = 2005;

/** True only on March 21 (any year), for a full 24-hour window. */
export function isBirthdayToday(): boolean {
  const now = new Date();
  return now.getMonth() === BIRTHDAY_MONTH && now.getDate() === BIRTHDAY_DAY;
}

/**
 * Returns the Date of the NEXT upcoming birthday.
 * - If today IS the birthday  → next year's March 21
 * - If birthday is still ahead this year → this year's March 21
 * - If birthday already passed this year → next year's March 21
 */
export function getNextBirthday(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const thisYearBD = new Date(year, BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0, 0);
  // Use strict < so that on the actual birthday we already point to next year
  if (now < thisYearBD && !isBirthdayToday()) {
    return thisYearBD;
  }
  return new Date(year + 1, BIRTHDAY_MONTH, BIRTHDAY_DAY, 0, 0, 0, 0);
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
