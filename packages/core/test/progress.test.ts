import { describe, expect, it } from 'vitest';
import { computeStreak, dayKey, markStudiedToday } from '../src';

const DAY = 86_400_000;
const NOW = new Date(2026, 7, 22, 18, 30, 0).getTime();

describe('markStudiedToday', () => {
  it('records today and starts a streak of 1', () => {
    const { studiedDates, streak } = markStudiedToday([], NOW);
    expect(studiedDates).toEqual([dayKey(NOW)]);
    expect(streak).toBe(1);
  });

  it('is idempotent within a day', () => {
    const first = markStudiedToday([], NOW);
    const second = markStudiedToday(first.studiedDates, NOW + 3600_000);
    expect(second.studiedDates).toEqual(first.studiedDates);
    expect(second.streak).toBe(1);
  });

  it('counts consecutive days', () => {
    let dates: string[] = [];
    for (let i = 4; i >= 0; i--) {
      dates = markStudiedToday(dates, NOW - i * DAY).studiedDates;
    }
    expect(computeStreak(dates, NOW)).toBe(5);
  });

  it('a skipped day breaks the streak — but never goes negative or punishes', () => {
    const dates = [dayKey(NOW - 3 * DAY), dayKey(NOW - 2 * DAY)]; // studied, then skipped yesterday
    expect(computeStreak(dates, NOW)).toBe(0);
    // studying again simply restarts at 1 — no penalty state exists
    const { streak } = markStudiedToday(dates, NOW);
    expect(streak).toBe(1);
  });

  it('gives a grace day: a run ending yesterday still shows until today is missed', () => {
    const dates = [dayKey(NOW - 2 * DAY), dayKey(NOW - DAY)]; // studied up to yesterday
    expect(computeStreak(dates, NOW)).toBe(2);
    // ...and studying today extends it rather than restarting
    expect(markStudiedToday(dates, NOW).streak).toBe(3);
  });

  it('handles month boundaries via real date math', () => {
    const sep1 = new Date(2026, 8, 1, 10, 0, 0).getTime();
    const aug31 = new Date(2026, 7, 31, 10, 0, 0).getTime();
    const dates = [dayKey(aug31), dayKey(sep1)];
    expect(computeStreak(dates, sep1)).toBe(2);
  });
});
