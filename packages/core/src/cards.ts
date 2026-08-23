import type { Card } from './types';

/** Validates the card shape the API (or the offline fallback) must produce. */
export function isValidCards(cards: unknown): cards is Card[] {
  return (
    Array.isArray(cards) &&
    cards.length > 0 &&
    cards.every(
      (c) =>
        c &&
        typeof c.question === 'string' &&
        c.question.trim().length > 0 &&
        typeof c.answer === 'string' &&
        c.answer.trim().length > 0,
    )
  );
}

// Answers that came from a multiple-choice question arrive as "B. the answer".
// A flashcard has no options, so the letter is meaningless noise: strip it.
export function stripChoiceLetter(t: unknown): string {
  return String(t || '')
    .replace(/^\s*[A-Da-d][.)]\s+/, '')
    .trim();
}

/** Guards against missing fields so the UI never renders undefined. */
export function buildFlashcards(cards: Card[]): Card[] {
  return cards.map((c) => ({
    question: c.question,
    answer: stripChoiceLetter(c.answer),
    methodTag: c.methodTag || '',
    srKey: c.srKey,
  }));
}

export interface MCQItem {
  question: string;
  options: string[];
  answer: string;
}

/**
 * Builds multiple-choice questions from flashcards, using other cards' answers
 * as distractors. `rng` is injectable for deterministic tests.
 */
export function buildMCQ(cards: Card[], count = 10, rng: () => number = Math.random): MCQItem[] {
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => rng() - 0.5);
  const answers = cards.map((c) => c.answer);
  return cards
    .map((c, i) => {
      const distractors = answers.filter(
        (a, j) => j !== i && a.toLowerCase() !== c.answer.toLowerCase(),
      );
      const options = shuffle([c.answer, ...shuffle(distractors).slice(0, 3)]);
      return { question: c.question, options, answer: c.answer };
    })
    .slice(0, count);
}

/**
 * Client-side blurting feedback: which card answers appear in the student's
 * free-recall text (by keyword overlap), and which are missing.
 */
export function keywordOverlapFeedback(
  cards: Card[],
  userText: string,
): { covered: Card[]; missed: Card[] } {
  const lower = (userText || '').toLowerCase();
  const covered: Card[] = [];
  const missed: Card[] = [];
  for (const c of cards) {
    const term = (c.answer || '').toLowerCase();
    const hit = !!term && lower.includes(term.slice(0, 24));
    if (hit) covered.push(c);
    else missed.push(c);
  }
  return { covered, missed };
}
