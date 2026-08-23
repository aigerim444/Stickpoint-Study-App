import { describe, expect, it } from 'vitest';
import { buildFlashcards, buildMCQ, detectMath, isValidCards, keywordOverlapFeedback, stripChoiceLetter } from '../src';

const cards = [
  { question: 'What is mitosis?', answer: 'Cell division', methodTag: 'active_recall' },
  { question: 'What is osmosis?', answer: 'B. Water diffusion', methodTag: 'blurting' },
  { question: 'Powerhouse of the cell?', answer: 'Mitochondria', methodTag: 'active_recall' },
  { question: 'What is ATP?', answer: 'Energy currency', methodTag: 'feynman' },
];

describe('isValidCards', () => {
  it('accepts well-formed cards and rejects everything else', () => {
    expect(isValidCards(cards)).toBe(true);
    expect(isValidCards([])).toBe(false);
    expect(isValidCards(null)).toBe(false);
    expect(isValidCards([{ question: 'q', answer: '' }])).toBe(false);
    expect(isValidCards([{ question: 'q' }])).toBe(false);
  });
});

describe('buildFlashcards', () => {
  it('strips multiple-choice letters off answers', () => {
    expect(stripChoiceLetter('B. Water diffusion')).toBe('Water diffusion');
    expect(stripChoiceLetter('c) lowercase too')).toBe('lowercase too');
    expect(stripChoiceLetter('Delta is not a choice letter')).toBe('Delta is not a choice letter');
    const built = buildFlashcards(cards);
    expect(built[1].answer).toBe('Water diffusion');
  });

  it('defaults a missing methodTag to empty string', () => {
    const built = buildFlashcards([{ question: 'q', answer: 'a' } as never]);
    expect(built[0].methodTag).toBe('');
  });
});

describe('buildMCQ', () => {
  it('builds one MCQ per card with the right answer among the options', () => {
    const rng = () => 0.42; // deterministic
    const mcq = buildMCQ(cards, 10, rng);
    expect(mcq).toHaveLength(4);
    for (const item of mcq) {
      expect(item.options).toContain(item.answer);
      expect(item.options.length).toBeLessThanOrEqual(4);
      expect(new Set(item.options).size).toBe(item.options.length);
    }
  });

  it('respects the count cap', () => {
    expect(buildMCQ(cards, 2, () => 0.5)).toHaveLength(2);
  });
});

describe('keywordOverlapFeedback', () => {
  it('splits cards into covered and missed by answer keyword', () => {
    const { covered, missed } = keywordOverlapFeedback(
      cards,
      'I remember that mitochondria make energy and cell division happens',
    );
    expect(covered.map((c) => c.answer)).toContain('Mitochondria');
    expect(covered.map((c) => c.answer)).toContain('Cell division');
    expect(missed.map((c) => c.question)).toContain('What is osmosis?');
  });
});

describe('detectMath', () => {
  it('detects math by keyword and by symbols', () => {
    expect(detectMath('Solve the quadratic equation x^2 + 3x')).toBe(true);
    expect(detectMath('The integral of sin is -cos')).toBe(true);
    expect(detectMath('area = π r squared')).toBe(true);
    expect(detectMath('7 * 8 = 56')).toBe(true);
  });

  it('does not fire on humanities material', () => {
    expect(detectMath('The French Revolution began in 1789 and reshaped Europe.')).toBe(false);
    expect(detectMath('Psychology studies memory, attention, and perception.')).toBe(false);
    expect(detectMath('')).toBe(false);
  });
});
