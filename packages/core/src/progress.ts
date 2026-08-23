import { dayKey } from './spacedRepetition';

/**
 * Progress rules: streaks and studied-day tracking.
 *
 * Deliberate design principle (from the team's own research on avoidance and
 * self-doubt): progress mechanics must be shame-free. Streaks only ever count
 * up from consecutive studied days — there are no penalties, no lost XP, and
 * nothing public. Keep it that way.
 */

/** Count of consecutive studied days ending at `now` (local time). */
export function computeStreak(studiedDates: string[], now: number): number {
  const set = new Set(studiedDates);
  let streak = 0;
  const d = new Date(now);
  for (;;) {
    const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (!set.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * Marks today as studied and recomputes the streak.
 * Idempotent: marking the same day twice changes nothing.
 */
export function markStudiedToday(
  studiedDates: string[],
  now: number,
): { studiedDates: string[]; streak: number } {
  const today = dayKey(now);
  const dates = studiedDates.includes(today) ? studiedDates : studiedDates.concat(today);
  return { studiedDates: dates, streak: computeStreak(dates, now) };
}
