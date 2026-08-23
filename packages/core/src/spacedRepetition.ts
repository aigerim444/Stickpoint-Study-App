import type { DrillRating, MissedItem } from './types';

/**
 * Leitner-style spaced repetition for the missed-items bank.
 *
 * A missed item comes back tomorrow, then 2, 4, 7, 14 days out as the student
 * keeps getting it right. Missing it again drops it straight back to box 0.
 *
 * All functions are pure: they take the bank and the current time and return a
 * new bank, so callers own persistence and the logic is fully testable.
 */
export const SR_DAYS = [1, 2, 4, 7, 14];

const DAY_MS = 86_400_000;

/** Bank size cap — oldest entries fall off first (matches the web app). */
export const MISSED_BANK_CAP = 120;

/** Local-date key, e.g. "2026-8-22". Matches the web app's persisted format exactly. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

/** When an item in the given Leitner box is next due. */
export function dueAtFor(box: number, now: number): number {
  const days = SR_DAYS[Math.min(box, SR_DAYS.length - 1)];
  return now + days * DAY_MS;
}

/** Dedup key for a missed question. */
export function missedKey(question: string): string {
  return question.trim().toLowerCase().slice(0, 120);
}

export interface MissedInput {
  question: string;
  answer: string;
  topic?: string;
}

/**
 * Records freshly missed items into the bank. Re-missing an existing item
 * bumps its miss count and resets it to box 0, due tomorrow.
 */
export function recordMissed(
  bank: MissedItem[],
  items: MissedInput[],
  source: string,
  now: number,
  fallbackTopic = 'Your notes',
): MissedItem[] {
  if (!items || !items.length) return bank;
  const next = bank.map((b) => ({ ...b }));
  items.forEach((it) => {
    const q = String(it.question || '').trim();
    const a = String(it.answer || '').trim();
    if (!q || !a) return;
    const key = missedKey(q);
    const found = next.find((b) => b.key === key);
    if (found) {
      found.misses = (found.misses || 1) + 1;
      found.box = 0;
      found.dueAt = dueAtFor(0, now);
      found.answer = a;
      found.topic = it.topic || found.topic;
      found.source = source;
    } else {
      next.push({
        key,
        question: q,
        answer: a,
        source,
        topic: it.topic || fallbackTopic,
        misses: 1,
        box: 0,
        dueAt: dueAtFor(0, now),
        added: now,
      });
    }
  });
  return next.slice(-MISSED_BANK_CAP);
}

/**
 * Applies a drill rating: hard → back to box 0 and counts as a miss;
 * medium → stays in place; easy → up one box (capped at the last box).
 * Either way the item is rescheduled from now.
 */
export function gradeMissedItem(
  bank: MissedItem[],
  key: string,
  rating: DrillRating,
  now: number,
): MissedItem[] {
  return bank.map((b) => {
    if (b.key !== key) return b;
    const item = { ...b };
    if (rating === 'hard') {
      item.box = 0;
      item.misses = (item.misses || 1) + 1;
    } else if (rating === 'medium') {
      item.box = Math.max(0, item.box || 0);
    } else {
      item.box = Math.min(SR_DAYS.length - 1, (item.box || 0) + 1);
    }
    item.dueAt = dueAtFor(item.box, now);
    item.lastSeen = now;
    return item;
  });
}

/** Items due for drilling right now, most-missed first. */
export function dueMissed(bank: MissedItem[], now: number): MissedItem[] {
  return bank
    .filter((b) => (b.dueAt || 0) <= now)
    .sort((a, b) => (b.misses || 0) - (a.misses || 0));
}
