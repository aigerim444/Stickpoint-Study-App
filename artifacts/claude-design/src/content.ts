// Stickpoint content-generation helpers (client-side heuristics, no API needed for these)

const STOPWORDS = new Set(("the a an and or but of to in on for with is are was were be been being this that these "+
  "those it its as at by from into over under between out about than then so not no yes you your i we they he she "+
  "them his her our their which who whom what when where why how do does did can could will would should shall may "+
  "might must also very more most such only own same each other some any all just because while during before after "+
  "above below up down again further once here there all both each few more most other some such nor own too very "+
  "s t don now").split(/\s+/));

export { STOPWORDS };

export function cleanSentences(text: string): string[] {
  return (text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 25 && s.split(" ").length > 5);
}

export function pickKeyTerm(sentence: string): string {
  const words = sentence.replace(/[^a-zA-Z0-9' -]/g, "").split(" ").filter(Boolean);
  let best = "";
  for (const w of words) {
    const lw = w.toLowerCase();
    if (STOPWORDS.has(lw)) continue;
    if (w.length > best.length && w.length > 3) best = w;
  }
  return best || (words[words.length - 1] || "");
}

// Offline fallback card builder
export function localExtractCards(text: string, count = 8): any[] {
  const sentences = cleanSentences(text);
  const chosen = sentences.slice(0, count);
  const tags = ["active_recall", "blurting", "practice_testing", "feynman", "concrete_examples", "self_explanation", "elaborative_interrogation"];
  return chosen.map((sentence: string, i: number) => {
    const term = pickKeyTerm(sentence);
    const question = term
      ? sentence.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "___")
      : "What's the key idea here?";
    return { question, answer: term || sentence, methodTag: tags[i % tags.length] };
  });
}

export function localTopic(text: string): string {
  const first = cleanSentences(text)[0] || "";
  const words = first.split(" ").slice(0, 6).join(" ");
  return words || "Your material";
}

export function isValidCards(cards: any): boolean {
  return Array.isArray(cards) && cards.length > 0 && cards.every((c: any) =>
    c && typeof c.question === "string" && c.question.trim().length > 0 &&
    typeof c.answer === "string" && c.answer.trim().length > 0
  );
}

const stripChoiceLetter = (t: string) => String(t || "").replace(/^\s*[A-Da-d][.)]\s+/, "").trim();

export function buildFlashcards(cards: any[]): any[] {
  return cards.map((c: any) => ({
    question: c.question,
    answer: stripChoiceLetter(c.answer),
    methodTag: c.methodTag || "",
    srKey: c.srKey,
  }));
}

export function buildMCQ(cards: any[]): any[] {
  const answers = cards.map((c: any) => c.answer);
  return cards.map((c: any, i: number) => {
    const distractors = answers.filter((a: any, j: number) => j !== i && a.toLowerCase() !== c.answer.toLowerCase());
    const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [c.answer, ...shuffledDistractors].sort(() => Math.random() - 0.5);
    return { question: c.question, options, answer: c.answer };
  }).slice(0, 5);
}

export function keywordOverlapFeedback(cards: any[], userText: string): { covered: any[]; missed: any[] } {
  const lower = (userText || "").toLowerCase();
  const covered: any[] = [];
  const missed: any[] = [];
  for (const c of cards) {
    const term = (c.answer || "").toLowerCase();
    const hit = term && lower.includes(term.slice(0, 24));
    if (hit) covered.push(c); else missed.push(c);
  }
  return { covered, missed };
}

export const METHODS = [
  {
    id: "problem_sets", label: "Problem Sets", icon: "sigma",
    evidence: "Sweller's worked-example research found students who study a solved problem before attempting one learn faster than students who only practise, and Rittle-Johnson's work shows explaining why a step works beats extra repetitions.",
    whyWorks: "Math isn't facts, it's moves. You watch the move done once, copy it with help, then do it alone, and when you slip, you find the exact line it went wrong instead of just seeing a red X.",
    appSteps: [
      "Chop pulls the problem TYPES out of your notes, not just terms.",
      "I DO: watch one fully worked solution, step by step, with the why.",
      "YOU DO: solve a fresh one, writing one step per line.",
      "Chop marks the first line that goes wrong, the rest is green.",
      "Your slip-ups get named (sign errors, skipped domain) and drilled."
    ]
  },
  {
    id: "active_recall", label: "Active Recall", icon: "brain",
    evidence: "A famous 2006 study found students who quizzed themselves remembered 50% more a week later than students who just reread their notes.",
    whyWorks: "Pulling info out of your brain (instead of just reading it back in) is what actually builds a strong memory. It's called the testing effect.",
    appSteps: [
      "Chop turns your notes into one flashcard per concept.",
      "You see only the question, no peeking!",
      "Reveal the answer when you've committed to a guess.",
      "Rate yourself Easy, Medium, or Hard.",
      "Hard cards come back before you finish, and again tomorrow."
    ]
  },
  {
    id: "blurting", label: "Blurting", icon: "scribble",
    evidence: "Research on the \"generation effect\" (Slamecka & Graf, 1978) shows info you produce yourself sticks way better than info you just read.",
    whyWorks: "Dumping everything you know onto a blank page, with zero peeking, forces your brain to work for it, which is exactly what makes it stick.",
    appSteps: [
      "Chop shows you only the topic name, notes stay hidden.",
      "You type everything you remember, no stopping to check.",
      "Hit done and Chop compares your blurt to the real notes.",
      "Covered ideas glow green, missed ideas show up red.",
      "Blurt again and watch your score climb."
    ]
  },
  {
    id: "practice_testing", label: "Practice Testing", icon: "target",
    evidence: "The biggest research review ever done on study methods (Dunlosky et al., 2013) rated practice testing the #1 most effective method that exists.",
    whyWorks: "Taking a real timed quiz trains the exact skill your test will actually demand: pulling answers out under pressure, not just recognizing them.",
    appSteps: [
      "Chop writes 10 mixed questions from your material.",
      "Notes stay hidden and the clock counts down, like a real exam.",
      "One question at a time, no going back, no feedback yet.",
      "At the end: your score, and every answer side by side.",
      "Missed questions go straight into your drill deck."
    ]
  },
  {
    id: "feynman", label: "Feynman Technique", icon: "chat",
    evidence: "Deep-processing research (Craik & Lockhart, 1972) shows explaining an idea in your own simple words locks it in far better than rereading it.",
    whyWorks: "If you can't explain it simply, you don't actually get it yet, this method finds the exact gap in your understanding before the test does.",
    appSteps: [
      "Chop picks the big concepts out of your notes.",
      "Close your notes and teach one like you're talking to a 10-year-old.",
      "Blank page, nothing to look at while you write.",
      "Chop scores it out of 5 and shows the ideal explanation.",
      "Weak concepts turn into flashcards at the end."
    ]
  },
  {
    id: "concrete_examples", label: "Concrete Examples", icon: "cube",
    evidence: "Dual coding research (Paivio) shows ideas paired with a real example get stored two ways in your brain, as words AND as a picture, so they stick harder.",
    whyWorks: "Abstract ideas slide right off your brain. A real example gives it something to grab onto, and helps you spot the idea again on a test, even reworded.",
    appSteps: [
      "Chop shows one concept plus a plain-English definition.",
      "Tap to reveal a real-world example you've actually seen.",
      "Explain how that example connects back to the concept.",
      "Chop checks the connection and reinforces the link.",
      "Want a different angle? Chop invents a fresh example."
    ]
  },
  {
    id: "pomodoro", label: "Pomodoro Timer", icon: "clock",
    evidence: "Attention research (Ariga & Lleras, 2011) shows short breaks keep your focus sharp, attention naturally drops off after 20-40 minutes straight.",
    whyWorks: "Your brain isn't built for hours of nonstop focus. Studying in short timed sprints with real breaks keeps every minute high-quality instead of foggy.",
    appSteps: [
      "Chop splits your notes into 3-5 minute chunks.",
      "Read one chunk at a time while the 25-minute clock runs.",
      "Time's up: a quick check-in on focus and the hardest chunk.",
      "Then a real 5-minute break with a fun fact.",
      "After 4 rounds, a longer break plus a session recap."
    ]
  },
  {
    id: "self_explanation", label: "Self-Explanation", icon: "chat",
    evidence: "Research by Chi et al. (1994) shows students who explain material to themselves sentence by sentence understand and retain far more than students who only read it.",
    whyWorks: "Putting each line into your own words forces your brain to actually process it, confusion gets caught immediately, on the exact sentence where it starts, instead of on the test.",
    appSteps: [
      "Chop lays your notes out as a page, one line at a time.",
      "The whole page stays visible, the line you're on is lit up.",
      "Say that line back in your own words. One sentence is plenty.",
      "Instant check, then straight on to the next line.",
      "Lines you fumbled get collected at the end as flashcards."
    ]
  },
  {
    id: "elaborative_interrogation", label: "Elaborative Interrogation", icon: "question",
    evidence: "Research since 1988 (Pressley et al.) shows asking \"why\" while studying beats just rereading, because it links new facts to what you already know.",
    whyWorks: "Understanding *why* something is true means you can rebuild the answer on a test even if you forget the exact wording, logic doesn't slip away like facts do.",
    appSteps: [
      "Chop shows one fact from your notes with a why question.",
      "Type your reasoning, no looking back at the notes.",
      "Chop checks your logic and shows a model answer.",
      "Then a follow-up: how does this connect to everything else?",
      "Anything shaky is flagged in your end-of-session summary."
    ]
  }
];

export const SUBJECTS = [
  { id: "math_science", label: "Math or Science" },
  { id: "history_humanities", label: "History or Humanities" },
  { id: "language", label: "A language, like Spanish or French" },
  { id: "english_writing", label: "English or Writing" },
  { id: "multiple", label: "Multiple subjects at once" }
];

export const MATH_METHODS = ["problem_sets", "practice_testing", "active_recall", "concrete_examples", "elaborative_interrogation", "feynman", "pomodoro"];

export const SUBJECT_METHOD_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  math_science: { primary: ["problem_sets", "practice_testing", "active_recall"], secondary: ["concrete_examples", "elaborative_interrogation"] },
  history_humanities: { primary: ["feynman", "elaborative_interrogation", "blurting"], secondary: ["active_recall", "self_explanation"] },
  language: { primary: ["active_recall", "blurting", "self_explanation"], secondary: ["practice_testing"] },
  english_writing: { primary: ["feynman", "elaborative_interrogation", "concrete_examples"], secondary: ["blurting"] },
  multiple: { primary: ["pomodoro", "self_explanation", "active_recall"], secondary: ["blurting"] }
};

export const QUIZ_QUESTIONS = [
  {
    q: "What does studying usually look like for you right now?",
    options: [
      { text: "I reread my notes or textbook until I feel ready", pts: { active_recall: 2, blurting: 2, practice_testing: 2 } },
      { text: "I write out everything I remember on a blank page", pts: { blurting: 3 } },
      { text: "I make flashcards or questions and test myself", pts: { active_recall: 3, self_explanation: 2 } },
      { text: "I ask AI or watch videos to explain things to me", pts: { feynman: 3, concrete_examples: 2 } },
      { text: "I do practice problems or past test questions", pts: { practice_testing: 3, elaborative_interrogation: 2 } }
    ]
  },
  {
    q: "What is your biggest problem when you study?",
    options: [
      { text: "I understand it while I study but forget it on the actual test", pts: { active_recall: 3, practice_testing: 2 } },
      { text: "I always run out of time and end up cramming", pts: { pomodoro: 3 } },
      { text: "I get distracted and lose focus after a few minutes", pts: { pomodoro: 3 } },
      { text: "I don't know what to focus on or where to even start", pts: { self_explanation: 3, blurting: 2 } },
      { text: "I can read something five times and still not really get it", pts: { feynman: 3, elaborative_interrogation: 2, concrete_examples: 2 } }
    ]
  },
  {
    q: "When you actually remember something weeks later, what usually helped?",
    options: [
      { text: "I explained it out loud to myself or someone else", pts: { feynman: 3 } },
      { text: "I tested myself on it over and over", pts: { active_recall: 3, practice_testing: 2 } },
      { text: "I connected it to a real-life example that made it click", pts: { concrete_examples: 3 } },
      { text: "I kept asking myself why it works that way", pts: { elaborative_interrogation: 3 } },
      { text: "I wrote out everything I knew from memory without looking", pts: { blurting: 3 } }
    ]
  },
  {
    q: "Which of these sounds most like how you feel when you study?",
    options: [
      { text: "I lose focus and drift off after about ten minutes", pts: { pomodoro: 3 } },
      { text: "I feel okay but I'm never sure if the studying is actually working", pts: { practice_testing: 2, self_explanation: 2 } },
      { text: "I get frustrated when I don't understand something and give up", pts: { concrete_examples: 2, feynman: 2 } },
      { text: "I feel overwhelmed by how much there is and don't know what to prioritize", pts: { self_explanation: 3, blurting: 2 } },
      { text: "I feel confident while studying but nervous when the test actually comes", pts: { active_recall: 2, practice_testing: 3 } }
    ]
  },
  {
    q: "How far in advance do you usually start studying for a big test?",
    options: [
      { text: "Night before or even the day of", pts: { pomodoro: 2, blurting: 2 } },
      { text: "Two to three days before", pts: { active_recall: 2, practice_testing: 2 } },
      { text: "About a week or more before", pts: { active_recall: 1, blurting: 1, practice_testing: 1, feynman: 1, concrete_examples: 1, pomodoro: 1, self_explanation: 1, elaborative_interrogation: 1 } },
      { text: "I don't really have a consistent pattern", pts: { self_explanation: 2, pomodoro: 2 } }
    ]
  },
  {
    q: "What would make studying feel like it's actually working for you?",
    options: [
      { text: "Seeing a score go up or a measurable improvement", pts: { practice_testing: 3, self_explanation: 2 } },
      { text: "Finally understanding something that confused me", pts: { feynman: 2, concrete_examples: 2, elaborative_interrogation: 2 } },
      { text: "Remembering things without having to look them up", pts: { active_recall: 2, blurting: 2 } },
      { text: "Staying focused for the whole session without getting distracted", pts: { pomodoro: 3 } },
      { text: "Knowing exactly what I need to work on and what I can stop worrying about", pts: { self_explanation: 3, blurting: 2 } }
    ]
  }
];

export const PIP_BITMAP = [
  "....KKKKK....",
  "...KBBBBBK...",
  "..KBBBBBBBK..",
  "..KBBEBEBBK..",
  "..KBBBBBBBK..",
  "...KKKKKKK...",
  "......K......",
  ".....KKK.....",
  "...K..K..K...",
  ".K....K....K.",
  "......K......",
  "......K......",
  "....K...K....",
  "..K.......K..",
  ".K.........K.",
];

export function pipGrid(palette: any): string[][] {
  const colors: any = Object.assign({
    ".": "transparent", K: "#1a1a2e", B: "#ff6b4a", E: "#ffffff"
  }, palette || {});
  return PIP_BITMAP.map((row: string) => row.split("").map((ch: string) => colors[ch] || "transparent"));
}

export function scoreQuiz(subjectId: string, answerIdxArr: any[]): { scores: Record<string, number>; ranked: string[] } {
  const scores: Record<string, number> = {};
  METHODS.forEach((m: any) => scores[m.id] = 0);
  QUIZ_QUESTIONS.forEach((question: any, qi: number) => {
    const raw = answerIdxArr[qi];
    if (raw == null) return;
    const picked = (Array.isArray(raw) ? raw : [raw]).filter((i: any) => i != null);
    if (!picked.length) return;
    const weight = 1 / picked.length;
    picked.map((i: number) => [question.options[i], weight]).forEach(([opt, w]: any) => {
      if (!opt) return;
      Object.entries(opt.pts).forEach(([id, pts]: any) => { scores[id] = (scores[id] || 0) + pts * w; });
    });
  });
  const subj = SUBJECT_METHOD_MAP[subjectId];
  if (subj) {
    subj.primary.forEach((id: string) => scores[id] = (scores[id] || 0) + 3);
    subj.secondary.forEach((id: string) => scores[id] = (scores[id] || 0) + 1);
  }
  if (subjectId === 'math_science') ['blurting', 'self_explanation'].forEach((id: string) => scores[id] = (scores[id] || 0) - 4);
  if (subjectId && subjectId !== 'math_science') scores.problem_sets = (scores.problem_sets || 0) - 6;
  const ranked = Object.entries(scores).sort((a: any, b: any) => b[1] - a[1]).map(([id]: any) => id);
  return { scores, ranked };
}
