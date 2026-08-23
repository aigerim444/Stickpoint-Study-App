import type { Method } from './types';

/**
 * The study methods, ported verbatim from the web app
 * (artifacts/claude-design/public/stickpoint-content.js — the behavioral spec).
 *
 * The `evidence` copy is user-facing and research-cited: any edit must be
 * checked against the professor fact-check deck before shipping.
 */
export const METHODS: Method[] = [
  {
    id: 'problem_sets',
    label: 'Problem Sets',
    icon: 'sigma',
    evidence:
      "Sweller's worked-example research found students who study a solved problem before attempting one learn faster than students who only practise, and Rittle-Johnson's work shows explaining why a step works beats extra repetitions.",
    whyWorks:
      "Math isn't facts, it's moves. You watch the move done once, copy it with help, then do it alone, and when you slip, you find the exact line it went wrong instead of just seeing a red X.",
    appSteps: [
      'Chop pulls the problem TYPES out of your notes, not just terms.',
      'I DO: watch one fully worked solution, step by step, with the why.',
      'YOU DO: solve a fresh one, writing one step per line.',
      'Chop marks the first line that goes wrong, the rest is green.',
      'Your slip-ups get named (sign errors, skipped domain) and drilled.',
    ],
  },
  {
    id: 'active_recall',
    label: 'Active Recall',
    icon: 'brain',
    evidence:
      'A famous 2006 study found students who quizzed themselves remembered 50% more a week later than students who just reread their notes.',
    whyWorks:
      "Pulling info out of your brain (instead of just reading it back in) is what actually builds a strong memory. It's called the testing effect.",
    appSteps: [
      'Chop turns your notes into one flashcard per concept.',
      'You see only the question, no peeking!',
      "Reveal the answer when you've committed to a guess.",
      'Rate yourself Easy, Medium, or Hard.',
      'Hard cards come back before you finish, and again tomorrow.',
    ],
  },
  {
    id: 'blurting',
    label: 'Blurting',
    icon: 'scribble',
    evidence:
      'Research on the "generation effect" (Slamecka & Graf, 1978) shows info you produce yourself sticks way better than info you just read.',
    whyWorks:
      'Dumping everything you know onto a blank page, with zero peeking, forces your brain to work for it, which is exactly what makes it stick.',
    appSteps: [
      'Chop shows you only the topic name, notes stay hidden.',
      'You type everything you remember, no stopping to check.',
      'Hit done and Chop compares your blurt to the real notes.',
      'Covered ideas glow green, missed ideas show up red.',
      'Blurt again and watch your score climb.',
    ],
  },
  {
    id: 'practice_testing',
    label: 'Practice Testing',
    icon: 'target',
    evidence:
      'The biggest research review ever done on study methods (Dunlosky et al., 2013) rated practice testing the #1 most effective method that exists.',
    whyWorks:
      'Taking a real timed quiz trains the exact skill your test will actually demand: pulling answers out under pressure, not just recognizing them.',
    appSteps: [
      'Chop writes 10 mixed questions from your material.',
      'Notes stay hidden and the clock counts down, like a real exam.',
      'One question at a time, no going back, no feedback yet.',
      'At the end: your score, and every answer side by side.',
      'Missed questions go straight into your drill deck.',
    ],
  },
  {
    id: 'feynman',
    label: 'Feynman Technique',
    icon: 'chat',
    evidence:
      'Deep-processing research (Craik & Lockhart, 1972) shows explaining an idea in your own simple words locks it in far better than rereading it.',
    whyWorks:
      "If you can't explain it simply, you don't actually get it yet, this method finds the exact gap in your understanding before the test does.",
    appSteps: [
      'Chop picks the big concepts out of your notes.',
      "Close your notes and teach one like you're talking to a 10-year-old.",
      'Blank page, nothing to look at while you write.',
      'Chop scores it out of 5 and shows the ideal explanation.',
      'Weak concepts turn into flashcards at the end.',
    ],
  },
  {
    id: 'concrete_examples',
    label: 'Concrete Examples',
    icon: 'cube',
    evidence:
      'Dual coding research (Paivio) shows ideas paired with a real example get stored two ways in your brain, as words AND as a picture, so they stick harder.',
    whyWorks:
      'Abstract ideas slide right off your brain. A real example gives it something to grab onto, and helps you spot the idea again on a test, even reworded.',
    appSteps: [
      'Chop shows one concept plus a plain-English definition.',
      "Tap to reveal a real-world example you've actually seen.",
      'Explain how that example connects back to the concept.',
      'Chop checks the connection and reinforces the link.',
      'Want a different angle? Chop invents a fresh example.',
    ],
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    icon: 'clock',
    evidence:
      'Attention research (Ariga & Lleras, 2011) shows short breaks keep your focus sharp, attention naturally drops off after 20–40 minutes straight.',
    whyWorks:
      "Your brain isn't built for hours of nonstop focus. Studying in short timed sprints with real breaks keeps every minute high-quality instead of foggy.",
    appSteps: [
      'Chop splits your notes into 3–5 minute chunks.',
      'Read one chunk at a time while the 25-minute clock runs.',
      "Time's up: a quick check-in on focus and the hardest chunk.",
      'Then a real 5-minute break with a fun fact.',
      'After 4 rounds, a longer break plus a session recap.',
    ],
  },
  {
    id: 'self_explanation',
    label: 'Self-Explanation',
    icon: 'chat',
    evidence:
      'Research by Chi et al. (1994) shows students who explain material to themselves sentence by sentence understand and retain far more than students who only read it.',
    whyWorks:
      'Putting each line into your own words forces your brain to actually process it, confusion gets caught immediately, on the exact sentence where it starts, instead of on the test.',
    appSteps: [
      'Chop lays your notes out as a page, one line at a time.',
      "The whole page stays visible, the line you're on is lit up.",
      'Say that line back in your own words. One sentence is plenty.',
      'Instant check, then straight on to the next line.',
      'Lines you fumbled get collected at the end as flashcards.',
    ],
  },
  {
    id: 'elaborative_interrogation',
    label: 'Elaborative Interrogation',
    icon: 'question',
    evidence:
      'Research since 1988 (Pressley et al.) shows asking "why" while studying beats just rereading, because it links new facts to what you already know.',
    whyWorks:
      "Understanding *why* something is true means you can rebuild the answer on a test even if you forget the exact wording, logic doesn't slip away like facts do.",
    appSteps: [
      'Chop shows one fact from your notes with a why question.',
      'Type your reasoning, no looking back at the notes.',
      'Chop checks your logic and shows a model answer.',
      'Then a follow-up: how does this connect to everything else?',
      'Anything shaky is flagged in your end-of-session summary.',
    ],
  },
];

export const SUBJECTS = [
  { id: 'math_science', label: 'Math or Science' },
  { id: 'history_humanities', label: 'History or Humanities' },
  { id: 'language', label: 'A language, like Spanish or French' },
  { id: 'english_writing', label: 'English or Writing' },
  { id: 'multiple', label: 'Multiple subjects at once' },
] as const;

// Methods that actually transfer to procedural maths, best first. Free-recall prose
// methods (blurting, self-explanation) are deliberately absent.
export const MATH_METHODS = [
  'problem_sets',
  'practice_testing',
  'active_recall',
  'concrete_examples',
  'elaborative_interrogation',
  'feynman',
  'pomodoro',
];

export const SUBJECT_METHOD_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  math_science: {
    primary: ['problem_sets', 'practice_testing', 'active_recall'],
    secondary: ['concrete_examples', 'elaborative_interrogation'],
  },
  history_humanities: {
    primary: ['feynman', 'elaborative_interrogation', 'blurting'],
    secondary: ['active_recall', 'self_explanation'],
  },
  language: {
    primary: ['active_recall', 'blurting', 'self_explanation'],
    secondary: ['practice_testing'],
  },
  english_writing: {
    primary: ['feynman', 'elaborative_interrogation', 'concrete_examples'],
    secondary: ['blurting'],
  },
  multiple: {
    primary: ['pomodoro', 'self_explanation', 'active_recall'],
    secondary: ['blurting'],
  },
};

export function getMethodById(id: string): Method | undefined {
  return METHODS.find((m) => m.id === id);
}
