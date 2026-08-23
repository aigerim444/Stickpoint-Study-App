import type { QuizAnswer, QuizQuestion, QuizResult } from './types';
import { METHODS, SUBJECT_METHOD_MAP } from './methods';

/**
 * The 6 diagnostic questions, ported verbatim from the web app spec.
 * The subject question is asked separately and passed to scoreQuiz as subjectId.
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: 'What does studying usually look like for you right now?',
    options: [
      { text: 'I reread my notes or textbook until I feel ready', pts: { active_recall: 2, blurting: 2, practice_testing: 2 } },
      { text: 'I write out everything I remember on a blank page', pts: { blurting: 3 } },
      { text: 'I make flashcards or questions and test myself', pts: { active_recall: 3, self_explanation: 2 } },
      { text: 'I ask AI or watch videos to explain things to me', pts: { feynman: 3, concrete_examples: 2 } },
      { text: 'I do practice problems or past test questions', pts: { practice_testing: 3, elaborative_interrogation: 2 } },
    ],
  },
  {
    q: 'What is your biggest problem when you study?',
    options: [
      { text: 'I understand it while I study but forget it on the actual test', pts: { active_recall: 3, practice_testing: 2 } },
      { text: 'I always run out of time and end up cramming', pts: { pomodoro: 3 } },
      { text: 'I get distracted and lose focus after a few minutes', pts: { pomodoro: 3 } },
      { text: "I don't know what to focus on or where to even start", pts: { self_explanation: 3, blurting: 2 } },
      { text: 'I can read something five times and still not really get it', pts: { feynman: 3, elaborative_interrogation: 2, concrete_examples: 2 } },
    ],
  },
  {
    q: 'When you actually remember something weeks later, what usually helped?',
    options: [
      { text: 'I explained it out loud to myself or someone else', pts: { feynman: 3 } },
      { text: 'I tested myself on it over and over', pts: { active_recall: 3, practice_testing: 2 } },
      { text: 'I connected it to a real-life example that made it click', pts: { concrete_examples: 3 } },
      { text: 'I kept asking myself why it works that way', pts: { elaborative_interrogation: 3 } },
      { text: 'I wrote out everything I knew from memory without looking', pts: { blurting: 3 } },
    ],
  },
  {
    q: 'Which of these sounds most like how you feel when you study?',
    options: [
      { text: 'I lose focus and drift off after about ten minutes', pts: { pomodoro: 3 } },
      { text: "I feel okay but I'm never sure if the studying is actually working", pts: { practice_testing: 2, self_explanation: 2 } },
      { text: "I get frustrated when I don't understand something and give up", pts: { concrete_examples: 2, feynman: 2 } },
      { text: "I feel overwhelmed by how much there is and don't know what to prioritize", pts: { self_explanation: 3, blurting: 2 } },
      { text: 'I feel confident while studying but nervous when the test actually comes', pts: { active_recall: 2, practice_testing: 3 } },
    ],
  },
  {
    q: 'How far in advance do you usually start studying for a big test?',
    options: [
      { text: 'Night before or even the day of', pts: { pomodoro: 2, blurting: 2 } },
      { text: 'Two to three days before', pts: { active_recall: 2, practice_testing: 2 } },
      { text: 'About a week or more before', pts: { active_recall: 1, blurting: 1, practice_testing: 1, feynman: 1, concrete_examples: 1, pomodoro: 1, self_explanation: 1, elaborative_interrogation: 1 } },
      { text: "I don't really have a consistent pattern", pts: { self_explanation: 2, pomodoro: 2 } },
    ],
  },
  {
    q: "What would make studying feel like it's actually working for you?",
    options: [
      { text: 'Seeing a score go up or a measurable improvement', pts: { practice_testing: 3, self_explanation: 2 } },
      { text: 'Finally understanding something that confused me', pts: { feynman: 2, concrete_examples: 2, elaborative_interrogation: 2 } },
      { text: 'Remembering things without having to look them up', pts: { active_recall: 2, blurting: 2 } },
      { text: 'Staying focused for the whole session without getting distracted', pts: { pomodoro: 3 } },
      { text: "Knowing exactly what I need to work on and what I can stop worrying about", pts: { self_explanation: 3, blurting: 2 } },
    ],
  },
];

/**
 * Scores the diagnostic quiz and ranks all methods, best match first.
 *
 * An answer is either one option index, or an array of up to two indices when
 * the student was torn. Tied options split the question's weight evenly.
 *
 * Subject adjustments (behavior-identical to the web app):
 *  - the subject's primary methods get +3, secondary +1
 *  - math_science: blurting and self_explanation get −4 (free-recall prose
 *    methods don't transfer to procedural math)
 *  - any other subject: problem_sets gets −6 (only makes sense where there
 *    are problems to work)
 */
export function scoreQuiz(subjectId: string | null, answers: QuizAnswer[]): QuizResult {
  const scores: Record<string, number> = {};
  METHODS.forEach((m) => (scores[m.id] = 0));

  QUIZ_QUESTIONS.forEach((question, qi) => {
    const raw = answers[qi];
    if (raw == null) return;
    const picked = (Array.isArray(raw) ? raw : [raw]).filter((i): i is number => i != null);
    if (!picked.length) return;
    const weight = 1 / picked.length;
    picked.forEach((i) => {
      const opt = question.options[i];
      if (!opt) return;
      Object.entries(opt.pts).forEach(([id, pts]) => {
        scores[id] = (scores[id] || 0) + pts * weight;
      });
    });
  });

  const subj = subjectId ? SUBJECT_METHOD_MAP[subjectId] : undefined;
  if (subj) {
    subj.primary.forEach((id) => (scores[id] = (scores[id] || 0) + 3));
    subj.secondary.forEach((id) => (scores[id] = (scores[id] || 0) + 1));
  }
  if (subjectId === 'math_science') {
    ['blurting', 'self_explanation'].forEach((id) => (scores[id] = (scores[id] || 0) - 4));
  }
  if (subjectId && subjectId !== 'math_science') {
    scores.problem_sets = (scores.problem_sets || 0) - 6;
  }

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  return { scores, ranked, topMethods: ranked.slice(0, 3) };
}
