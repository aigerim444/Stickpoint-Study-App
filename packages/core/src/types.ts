/** A flashcard extracted from the student's material. */
export interface Card {
  question: string;
  answer: string;
  /** Which study method this card suits best (a Method id). */
  methodTag: string;
  /** Links a drill card back to its missed-bank entry. */
  srKey?: string;
}

/** One of the 8 evidence-based study methods (plus concrete examples = 9 total). */
export interface Method {
  id: string;
  label: string;
  /** Icon name — interpreted per platform (web pixel icon / Feather on mobile). */
  icon: string;
  /** Plain-language research evidence line shown to students. Must stay consistent with the professor fact-check deck. */
  evidence: string;
  whyWorks: string;
  /** How the method plays out inside the app, step by step. */
  appSteps: string[];
}

export interface QuizOption {
  text: string;
  /** Weighted points this answer awards to method ids. */
  pts: Record<string, number>;
}

export interface QuizQuestion {
  q: string;
  options: QuizOption[];
}

/**
 * A quiz answer: one option index, an array of up to two indices when the
 * student was torn between options, or null when unanswered.
 */
export type QuizAnswer = number | number[] | null;

export interface QuizResult {
  scores: Record<string, number>;
  /** All method ids, best match first. */
  ranked: string[];
  /** The student's recommended starting point: ranked.slice(0, 3). */
  topMethods: string[];
}

/** An item in the missed-items bank, drilled via Leitner-style spaced repetition. */
export interface MissedItem {
  /** Dedup key: lowercased question, first 120 chars. */
  key: string;
  question: string;
  answer: string;
  /** Which feature produced the miss (e.g. 'practice test', 'active recall'). */
  source: string;
  topic?: string;
  /** How many times the student has missed this item. */
  misses: number;
  /** Leitner box index into SR_DAYS. */
  box: number;
  /** Epoch ms when the item is next due. */
  dueAt: number;
  /** Epoch ms when the item entered the bank. */
  added: number;
  /** Epoch ms when the item was last drilled. */
  lastSeen?: number;
}

export type DrillRating = 'easy' | 'medium' | 'hard';
