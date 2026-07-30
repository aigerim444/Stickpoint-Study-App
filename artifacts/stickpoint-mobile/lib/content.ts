// Stickpoint study content — quiz questions, methods, and scoring logic.
// Ported from stickpoint-content.js (web app).

export interface Card {
  question: string;
  answer: string;
  methodTag: string;
  srKey?: string;
}

export interface Method {
  id: string;
  label: string;
  icon: string; // Feather icon name
  evidence: string;
  whyWorks: string;
  appSteps: string[];
}

export interface QuizOption {
  text: string;
  pts: Record<string, number>;
}

export interface QuizQuestion {
  q: string;
  options: QuizOption[];
}

export const METHODS: Method[] = [
  {
    id: 'active_recall',
    label: 'Active Recall',
    icon: 'zap',
    evidence: "A famous 2006 study found students who quizzed themselves remembered 50% more a week later than students who just reread their notes.",
    whyWorks: "Pulling info out of your brain (instead of just reading it back in) is what actually builds a strong memory. It's called the testing effect.",
    appSteps: [
      'Chop turns your notes into one flashcard per concept.',
      'You see only the question, no peeking!',
      'Reveal the answer when you\'ve committed to a guess.',
      'Rate yourself Easy, Medium, or Hard.',
      'Hard cards come back before you finish, and again tomorrow.',
    ],
  },
  {
    id: 'blurting',
    label: 'Blurting',
    icon: 'edit-3',
    evidence: 'Research on the "generation effect" shows info you produce yourself sticks way better than info you just read.',
    whyWorks: 'Dumping everything you know onto a blank page, with zero peeking, forces your brain to work for it — which is exactly what makes it stick.',
    appSteps: [
      'Chop shows you only the topic name, notes stay hidden.',
      'You type everything you remember, no stopping to check.',
      'Hit done and Chop compares your blurt to the real notes.',
      'Covered ideas glow green, missed ideas show up red.',
      'Blurt again and watch your score climb.',
    ],
  },
  {
    id: 'feynman',
    label: 'Feynman Technique',
    icon: 'message-square',
    evidence: 'Deep-processing research shows explaining an idea in your own simple words locks it in far better than rereading it.',
    whyWorks: "If you can't explain it simply, you don't actually get it yet — this method finds the exact gap in your understanding before the test does.",
    appSteps: [
      'Chop picks the big concepts out of your notes.',
      "Close your notes and teach one like you're talking to a 10-year-old.",
      'Blank page, nothing to look at while you write.',
      'Chop scores it out of 5 and shows the ideal explanation.',
      'Weak concepts turn into flashcards at the end.',
    ],
  },
  {
    id: 'practice_testing',
    label: 'Practice Testing',
    icon: 'check-square',
    evidence: 'The biggest research review ever done on study methods (Dunlosky et al., 2013) rated practice testing the #1 most effective method that exists.',
    whyWorks: 'Taking a real timed quiz trains the exact skill your test will actually demand: pulling answers out under pressure, not just recognizing them.',
    appSteps: [
      'Chop writes 10 mixed questions from your material.',
      'Notes stay hidden and the clock counts down, like a real exam.',
      'One question at a time, no going back, no feedback yet.',
      'At the end: your score, and every answer side by side.',
      'Missed questions go straight into your drill deck.',
    ],
  },
  {
    id: 'self_explanation',
    label: 'Self-Explanation',
    icon: 'book-open',
    evidence: 'Research by Chi et al. (1994) shows students who explain material to themselves sentence by sentence understand and retain far more.',
    whyWorks: 'Putting each line into your own words forces your brain to actually process it — confusion gets caught immediately on the exact sentence where it starts.',
    appSteps: [
      'Chop lays your notes out as a page, one line at a time.',
      'The whole page stays visible, the line you\'re on is lit up.',
      'Say that line back in your own words.',
      'Instant check, then straight on to the next line.',
      'Lines you fumbled get collected at the end as flashcards.',
    ],
  },
  {
    id: 'elaborative_interrogation',
    label: 'Elaborative Interrogation',
    icon: 'help-circle',
    evidence: 'Research since 1988 shows asking "why" while studying beats just rereading, because it links new facts to what you already know.',
    whyWorks: 'Understanding *why* something is true means you can rebuild the answer on a test even if you forget the exact wording.',
    appSteps: [
      'Chop shows one fact from your notes with a why question.',
      'Type your reasoning, no looking back at the notes.',
      'Chop checks your logic and shows a model answer.',
      'Then a follow-up: how does this connect to everything else?',
      'Anything shaky is flagged in your end-of-session summary.',
    ],
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    icon: 'clock',
    evidence: 'Attention research shows short breaks keep your focus sharp — attention naturally drops off after 20–40 minutes straight.',
    whyWorks: "Your brain isn't built for hours of nonstop focus. Studying in short timed sprints with real breaks keeps every minute high-quality instead of foggy.",
    appSteps: [
      'Chop splits your notes into 3–5 minute chunks.',
      'Read one chunk at a time while the 25-minute clock runs.',
      "Time's up: a quick check-in on focus and the hardest chunk.",
      'Then a real 5-minute break.',
      'After 4 rounds, a longer break plus a session recap.',
    ],
  },
  {
    id: 'problem_sets',
    label: 'Problem Sets',
    icon: 'grid',
    evidence: "Sweller's worked-example research found students who study a solved problem before attempting one learn faster than students who only practise.",
    whyWorks: "Math isn't facts, it's moves. You watch the move done once, copy it with help, then do it alone.",
    appSteps: [
      'Chop pulls the problem TYPES out of your notes.',
      'I DO: watch one fully worked solution, step by step.',
      'YOU DO: solve a fresh one, writing one step per line.',
      'Chop marks the first line that goes wrong.',
      'Your slip-ups get named and drilled.',
    ],
  },
];

export const SUBJECTS = [
  { id: 'math_science', label: 'Math or Science' },
  { id: 'history_humanities', label: 'History or Humanities' },
  { id: 'language', label: 'A language (Spanish, French, etc.)' },
  { id: 'english_writing', label: 'English or Writing' },
  { id: 'multiple', label: 'Multiple subjects at once' },
];

export const SUBJECT_METHOD_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  math_science: { primary: ['problem_sets', 'practice_testing', 'active_recall'], secondary: ['elaborative_interrogation'] },
  history_humanities: { primary: ['feynman', 'elaborative_interrogation', 'blurting'], secondary: ['active_recall', 'self_explanation'] },
  language: { primary: ['active_recall', 'blurting', 'self_explanation'], secondary: ['practice_testing'] },
  english_writing: { primary: ['feynman', 'elaborative_interrogation'], secondary: ['blurting'] },
  multiple: { primary: ['pomodoro', 'self_explanation', 'active_recall'], secondary: ['blurting'] },
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: 'What does studying usually look like for you right now?',
    options: [
      { text: 'I reread my notes or textbook until I feel ready', pts: { active_recall: 2, blurting: 2, practice_testing: 2 } },
      { text: 'I write out everything I remember on a blank page', pts: { blurting: 3 } },
      { text: 'I make flashcards or questions and test myself', pts: { active_recall: 3, self_explanation: 2 } },
      { text: 'I ask AI or watch videos to explain things to me', pts: { feynman: 3, elaborative_interrogation: 2 } },
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
      { text: "I can read something five times and still not really get it", pts: { feynman: 3, elaborative_interrogation: 2 } },
    ],
  },
  {
    q: 'When you actually remember something weeks later, what usually helped?',
    options: [
      { text: 'I explained it out loud to myself or someone else', pts: { feynman: 3 } },
      { text: 'I tested myself on it over and over', pts: { active_recall: 3, practice_testing: 2 } },
      { text: 'I connected it to a real-life example that made it click', pts: { elaborative_interrogation: 3 } },
      { text: 'I kept asking myself why it works that way', pts: { elaborative_interrogation: 3 } },
      { text: 'I wrote out everything I knew from memory without looking', pts: { blurting: 3 } },
    ],
  },
  {
    q: 'Which sounds most like how you feel when you study?',
    options: [
      { text: 'I lose focus and drift off after about ten minutes', pts: { pomodoro: 3 } },
      { text: "I feel okay but I'm never sure if the studying is actually working", pts: { practice_testing: 2, self_explanation: 2 } },
      { text: "I get frustrated when I don't understand something", pts: { feynman: 2, elaborative_interrogation: 2 } },
      { text: "I feel overwhelmed and don't know what to prioritize", pts: { self_explanation: 3, blurting: 2 } },
      { text: 'I feel confident while studying but nervous when the test comes', pts: { active_recall: 2, practice_testing: 3 } },
    ],
  },
  {
    q: 'How far in advance do you usually start studying for a big test?',
    options: [
      { text: 'Night before or even the day of', pts: { pomodoro: 2, blurting: 2 } },
      { text: 'Two to three days before', pts: { active_recall: 2, practice_testing: 2 } },
      { text: 'About a week or more before', pts: { active_recall: 1, blurting: 1, practice_testing: 1, feynman: 1, pomodoro: 1, self_explanation: 1, elaborative_interrogation: 1 } },
      { text: "I don't really have a consistent pattern", pts: { self_explanation: 2, pomodoro: 2 } },
    ],
  },
  {
    q: 'What would make studying feel like it\'s actually working for you?',
    options: [
      { text: 'Seeing a score go up or a measurable improvement', pts: { practice_testing: 3, self_explanation: 2 } },
      { text: 'Finally understanding something that confused me', pts: { feynman: 2, elaborative_interrogation: 2 } },
      { text: 'Remembering things without having to look them up', pts: { active_recall: 2, blurting: 2 } },
      { text: 'Staying focused for the whole session without getting distracted', pts: { pomodoro: 3 } },
      { text: 'Knowing exactly what I need to work on', pts: { self_explanation: 3, blurting: 2 } },
    ],
  },
];

export function scoreQuiz(subjectId: string | null, answers: (number | number[] | null)[]): { scores: Record<string, number>; topMethods: string[] } {
  const scores: Record<string, number> = {};
  METHODS.forEach((m) => (scores[m.id] = 0));

  QUIZ_QUESTIONS.forEach((question, qi) => {
    const raw = answers[qi];
    if (raw == null) return;
    const picked = (Array.isArray(raw) ? raw : [raw]).filter((i) => i != null) as number[];
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

  if (subjectId) {
    const subj = SUBJECT_METHOD_MAP[subjectId];
    if (subj) {
      subj.primary.forEach((id) => (scores[id] = (scores[id] || 0) + 3));
      subj.secondary.forEach((id) => (scores[id] = (scores[id] || 0) + 1));
    }
    if (subjectId === 'math_science') {
      ['blurting', 'self_explanation'].forEach((id) => (scores[id] = (scores[id] || 0) - 4));
    }
    if (subjectId !== 'math_science') {
      scores.problem_sets = (scores.problem_sets || 0) - 6;
    }
  }

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  return { scores, topMethods: ranked.slice(0, 3) };
}

export function buildFlashcards(cards: Card[]): Card[] {
  return cards.map((c) => ({
    question: c.question,
    answer: String(c.answer || '').replace(/^\s*[A-Da-d][.)]\s+/, '').trim(),
    methodTag: c.methodTag || '',
    srKey: c.srKey,
  }));
}

export function buildMCQ(cards: Card[]): { question: string; options: string[]; answer: string }[] {
  const answers = cards.map((c) => c.answer);
  return cards
    .map((c, i) => {
      const distractors = answers.filter((a, j) => j !== i && a.toLowerCase() !== c.answer.toLowerCase());
      const shuffled = [...distractors].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [c.answer, ...shuffled].sort(() => Math.random() - 0.5);
      return { question: c.question, options, answer: c.answer };
    })
    .slice(0, 10);
}

export const MATH_METHODS = ['problem_sets', 'practice_testing', 'active_recall', 'elaborative_interrogation', 'feynman', 'pomodoro'];

export function getMethodById(id: string): Method | undefined {
  return METHODS.find((m) => m.id === id);
}
