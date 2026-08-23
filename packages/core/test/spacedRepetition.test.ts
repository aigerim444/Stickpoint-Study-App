import { describe, expect, it } from 'vitest';
import {
  MISSED_BANK_CAP,
  SR_DAYS,
  dayKey,
  dueAtFor,
  dueMissed,
  gradeMissedItem,
  missedKey,
  recordMissed,
} from '../src';

const DAY = 86_400_000;
const NOW = new Date(2026, 7, 22, 12, 0, 0).getTime();

const bankWith = (n = 1) =>
  recordMissed(
    [],
    Array.from({ length: n }, (_, i) => ({ question: `Q${i}?`, answer: `A${i}` })),
    'practice test',
    NOW,
  );

describe('scheduling', () => {
  it('uses the Leitner intervals 1, 2, 4, 7, 14 days', () => {
    expect(SR_DAYS).toEqual([1, 2, 4, 7, 14]);
    expect(dueAtFor(0, NOW)).toBe(NOW + 1 * DAY);
    expect(dueAtFor(4, NOW)).toBe(NOW + 14 * DAY);
    // boxes past the end clamp to the last interval
    expect(dueAtFor(99, NOW)).toBe(NOW + 14 * DAY);
  });

  it('formats day keys like the persisted web data (no zero padding)', () => {
    expect(dayKey(new Date(2026, 7, 5).getTime())).toBe('2026-8-5');
  });
});

describe('recordMissed', () => {
  it('adds new items in box 0, due tomorrow', () => {
    const bank = bankWith(1);
    expect(bank).toHaveLength(1);
    expect(bank[0]).toMatchObject({ box: 0, misses: 1, dueAt: NOW + DAY, source: 'practice test' });
    expect(bank[0].key).toBe(missedKey('Q0?'));
  });

  it('re-missing an item bumps misses and resets it to box 0', () => {
    let bank = bankWith(1);
    bank = gradeMissedItem(bank, bank[0].key, 'easy', NOW); // box 1
    bank = recordMissed(bank, [{ question: 'Q0?', answer: 'newer answer' }], 'blurting', NOW + DAY);
    expect(bank).toHaveLength(1);
    expect(bank[0]).toMatchObject({ misses: 2, box: 0, answer: 'newer answer', source: 'blurting' });
  });

  it('dedupes by normalized question, not exact text', () => {
    let bank = bankWith(1);
    bank = recordMissed(bank, [{ question: '  q0?  ', answer: 'A0' }], 'drill', NOW);
    expect(bank).toHaveLength(1);
    expect(bank[0].misses).toBe(2);
  });

  it('skips blank questions or answers', () => {
    const bank = recordMissed([], [{ question: '  ', answer: 'A' }, { question: 'Q', answer: '' }], 's', NOW);
    expect(bank).toHaveLength(0);
  });

  it('caps the bank at the most recent entries', () => {
    const bank = bankWith(MISSED_BANK_CAP + 10);
    expect(bank).toHaveLength(MISSED_BANK_CAP);
    // oldest entries fell off the front
    expect(bank[0].question).toBe('Q10?');
  });

  it('does not mutate the input bank', () => {
    const original = bankWith(1);
    const snapshot = JSON.parse(JSON.stringify(original));
    recordMissed(original, [{ question: 'Q0?', answer: 'changed' }], 'x', NOW);
    gradeMissedItem(original, original[0].key, 'easy', NOW);
    expect(original).toEqual(snapshot);
  });
});

describe('gradeMissedItem', () => {
  it('easy climbs one box, capped at the last box', () => {
    let bank = bankWith(1);
    for (let i = 0; i < 8; i++) bank = gradeMissedItem(bank, bank[0].key, 'easy', NOW);
    expect(bank[0].box).toBe(SR_DAYS.length - 1);
    expect(bank[0].dueAt).toBe(NOW + 14 * DAY);
  });

  it('medium stays in place, hard falls to box 0 and counts as a miss', () => {
    let bank = bankWith(1);
    bank = gradeMissedItem(bank, bank[0].key, 'easy', NOW);
    bank = gradeMissedItem(bank, bank[0].key, 'medium', NOW);
    expect(bank[0].box).toBe(1);
    bank = gradeMissedItem(bank, bank[0].key, 'hard', NOW);
    expect(bank[0]).toMatchObject({ box: 0, misses: 2, dueAt: NOW + DAY });
  });

  it('ignores unknown keys', () => {
    const bank = bankWith(1);
    expect(gradeMissedItem(bank, 'nope', 'easy', NOW)).toEqual(bank);
  });
});

describe('dueMissed', () => {
  it('returns only due items, most-missed first', () => {
    let bank = recordMissed(
      [],
      [
        { question: 'once?', answer: 'a' },
        { question: 'thrice?', answer: 'b' },
      ],
      's',
      NOW,
    );
    bank = recordMissed(bank, [{ question: 'thrice?', answer: 'b' }], 's', NOW);
    bank = recordMissed(bank, [{ question: 'thrice?', answer: 'b' }], 's', NOW);

    expect(dueMissed(bank, NOW)).toHaveLength(0); // nothing due yet
    const due = dueMissed(bank, NOW + DAY + 1);
    expect(due.map((b) => b.question)).toEqual(['thrice?', 'once?']);
  });
});
