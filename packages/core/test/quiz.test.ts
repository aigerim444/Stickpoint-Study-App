import { describe, expect, it } from 'vitest';
import { METHODS, MATH_METHODS, SUBJECT_METHOD_MAP, QUIZ_QUESTIONS, scoreQuiz } from '../src';

describe('method catalog', () => {
  it('has the 9 methods from the web spec', () => {
    expect(METHODS.map((m) => m.id).sort()).toEqual(
      [
        'active_recall',
        'blurting',
        'concrete_examples',
        'elaborative_interrogation',
        'feynman',
        'pomodoro',
        'practice_testing',
        'problem_sets',
        'self_explanation',
      ].sort(),
    );
  });

  it('every quiz option points at a real method', () => {
    const ids = new Set(METHODS.map((m) => m.id));
    for (const q of QUIZ_QUESTIONS) {
      for (const opt of q.options) {
        for (const id of Object.keys(opt.pts)) {
          expect(ids.has(id), `unknown method "${id}" in "${opt.text}"`).toBe(true);
        }
      }
    }
  });

  it('every subject-map and MATH_METHODS entry is a real method', () => {
    const ids = new Set(METHODS.map((m) => m.id));
    MATH_METHODS.forEach((id) => expect(ids.has(id)).toBe(true));
    for (const { primary, secondary } of Object.values(SUBJECT_METHOD_MAP)) {
      [...primary, ...secondary].forEach((id) => expect(ids.has(id)).toBe(true));
    }
  });

  it('excludes free-recall prose methods from MATH_METHODS on purpose', () => {
    expect(MATH_METHODS).not.toContain('blurting');
    expect(MATH_METHODS).not.toContain('self_explanation');
  });
});

describe('scoreQuiz', () => {
  it('awards option points and ranks all methods', () => {
    // Q1 option 1 = blurting: 3, everything else unanswered
    const { scores, ranked, topMethods } = scoreQuiz(null, [1, null, null, null, null, null]);
    expect(scores.blurting).toBe(3);
    expect(ranked[0]).toBe('blurting');
    expect(ranked).toHaveLength(METHODS.length);
    expect(topMethods).toEqual(ranked.slice(0, 3));
  });

  it('splits the weight evenly when the student was torn between two options', () => {
    // Q1 options 1 (blurting:3) and 2 (active_recall:3, self_explanation:2), tied
    const { scores } = scoreQuiz(null, [[1, 2], null, null, null, null, null]);
    expect(scores.blurting).toBeCloseTo(1.5);
    expect(scores.active_recall).toBeCloseTo(1.5);
    expect(scores.self_explanation).toBeCloseTo(1);
  });

  it('ignores unanswered questions and out-of-range indices', () => {
    const { scores } = scoreQuiz(null, [null, 99, [], null, null, null]);
    for (const v of Object.values(scores)) expect(v).toBe(0);
  });

  it('applies subject bonuses: primary +3, secondary +1', () => {
    const { scores } = scoreQuiz('history_humanities', [null, null, null, null, null, null]);
    expect(scores.feynman).toBe(3);
    expect(scores.active_recall).toBe(1);
    // non-math subject: problem_sets penalized out of contention
    expect(scores.problem_sets).toBe(-6);
  });

  it('penalizes prose methods by 4 points for math students', () => {
    const answers = [1, 3, 4, 3, 0, 4]; // heavy blurting/self_explanation answers
    const neutral = scoreQuiz(null, answers);
    const math = scoreQuiz('math_science', answers);
    expect(math.scores.blurting).toBe(neutral.scores.blurting - 4);
    expect(math.scores.self_explanation).toBe(neutral.scores.self_explanation - 4);
    // NOTE: the penalty is soft — extreme prose-heavy answers can still rank
    // blurting into the top 3. The hard guarantee for math materials lives in
    // the app's MATH_METHODS override, not in quiz scoring.
    expect(math.scores.blurting).toBe(10);
  });

  it('keeps prose methods out of the top 3 for a typical math student', () => {
    const answers = [4, 0, 1, 4, 1, 0]; // mixed, realistic answer pattern
    const { topMethods } = scoreQuiz('math_science', answers);
    expect(topMethods).not.toContain('blurting');
    expect(topMethods).not.toContain('self_explanation');
  });

  it('recommends problem sets for math students', () => {
    const { topMethods } = scoreQuiz('math_science', [null, null, null, null, null, null]);
    expect(topMethods).toContain('problem_sets');
  });

  it('never penalizes problem_sets when no subject was chosen', () => {
    const { scores } = scoreQuiz(null, [null, null, null, null, null, null]);
    expect(scores.problem_sets).toBe(0);
  });
});
