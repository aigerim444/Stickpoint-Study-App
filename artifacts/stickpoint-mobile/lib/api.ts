/**
 * Wrapper around the Stickpoint API server's Claude proxy.
 * All AI calls go through POST /api/claude.
 */

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : '';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

interface ClaudeOptions {
  messages: ClaudeMessage[];
  system?: string;
  max_tokens?: number;
}

export async function callClaude(opts: ClaudeOptions): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: opts.messages,
        system: opts.system,
        max_tokens: opts.max_tokens ?? 2000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text ?? null;
  } catch {
    return null;
  }
}

function ageDirective(name: string, age: number | null): string {
  if (!age) return '';
  let band: string;
  if (age <= 10) band = `They are ${age} years old, in elementary school. Use very short sentences and everyday words.`;
  else if (age <= 13) band = `They are ${age} years old, in middle school. Plain language, short sentences, no academic register.`;
  else if (age <= 18) band = `They are ${age} years old, in high school. Talk to them like a capable peer. Full technical vocabulary is fine as long as you define it once.`;
  else if (age <= 22) band = `They are ${age} years old, a university student. Use precise technical terms, draw examples from coursework and research.`;
  else band = `They are ${age} years old, an adult learner. Write to an intelligent adult. Use precise terminology.`;
  return `\n\nAUDIENCE: You are writing for a student named ${name || 'the student'}. ${band}\nMatch that level exactly. Never talk down to them. Keep humour dry and light. Never use em dashes.`;
}

export interface ExtractResult {
  topic: string;
  cards: Array<{ question: string; answer: string; methodTag: string }>;
  isMath: boolean;
}

export async function extractConcepts(
  material: string,
  name: string,
  age: number | null,
): Promise<ExtractResult | null> {
  const trimmed = material.trim().slice(0, 6000);
  const prompt =
    `Here is a student's study material:\n\n"""${trimmed}"""\n\n` +
    `Read these notes carefully and identify every individual vocabulary word, key concept, important person, significant date, and core idea. Create one flashcard for EACH one you find. Never combine multiple concepts into a single card.\n` +
    `Return between 8 and 20 cards, scaling with how much material is in the notes.\n` +
    `Return JSON only, no markdown fences:\n` +
    `{"topic": "short topic name, 4-6 words", "is_math": true or false, "cards": [{"question": "...", "answer": "...", "methodTag": "active_recall|blurting|practice_testing|feynman|self_explanation|elaborative_interrogation|pomodoro"}]}`;

  const system =
    'You are a study assistant that turns student notes into individual study cards. Respond with ONLY valid JSON, no markdown fences, no extra text. Never use em dashes.' +
    ageDirective(name, age);

  const text = await callClaude({ messages: [{ role: 'user', content: prompt }], system, max_tokens: 4000 });
  if (!text) return null;

  try {
    // Try direct parse first
    let parsed: { topic: string; is_math: boolean; cards: ExtractResult['cards'] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to salvage by extracting JSON object
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      parsed = JSON.parse(match[0]);
    }
    if (!parsed.cards?.length) return null;
    return { topic: parsed.topic || 'Your notes', cards: parsed.cards, isMath: !!parsed.is_math };
  } catch {
    return null;
  }
}

export interface BlurtGradeResult {
  covered: string[];
  missed: string[];
  scorePct: number;
}

export async function gradeBlurt(
  userText: string,
  notes: string,
  topicName: string,
  name: string,
  age: number | null,
): Promise<BlurtGradeResult | null> {
  const prompt =
    `The student is blurting about: "${topicName}"\n\nTheir notes:\n"""${notes.slice(0, 3000)}"""\n\nStudent's blurt:\n"""${userText}"""\n\n` +
    `Compare the blurt to the notes. Identify which key concepts from the notes they covered and which they missed.\n` +
    `Return JSON only: {"covered": ["concept1", "concept2"], "missed": ["concept3"], "scorePct": 75}`;
  const system = 'You grade student study blurts. Respond with ONLY valid JSON.' + ageDirective(name, age);
  const text = await callClaude({ messages: [{ role: 'user', content: prompt }], system, max_tokens: 1000 });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export interface FeynmanGradeResult {
  score: number;  // 1-5
  feedback: string;
  simpler: string;
  gotRight: string;
  gap: string | null;
}

export async function gradeFeynman(
  conceptName: string,
  definition: string,
  userExplanation: string,
  name: string,
  age: number | null,
): Promise<FeynmanGradeResult | null> {
  const prompt =
    `Concept: "${conceptName}"\nCorrect definition/notes: """${definition.slice(0, 1000)}"""\n\n` +
    `Student's explanation: """${userExplanation}"""\n\n` +
    `Grade this explanation 1-5 (5 = excellent, clear, complete). Identify what they got right and what the key gap is.\n` +
    `Return JSON only: {"score": 4, "feedback": "...", "simpler": "one-sentence plain English version", "gotRight": "...", "gap": "the main thing missing or unclear, or null if 5/5"}`;
  const system = 'You grade Feynman Technique explanations. Be encouraging but honest. JSON only.' + ageDirective(name, age);
  const text = await callClaude({ messages: [{ role: 'user', content: prompt }], system, max_tokens: 800 });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export interface ElabGradeResult {
  correct: boolean;
  feedback: string;
  modelAnswer: string;
}

export async function gradeElaborative(
  fact: string,
  whyQuestion: string,
  userAnswer: string,
  name: string,
  age: number | null,
): Promise<ElabGradeResult | null> {
  const prompt =
    `Fact: "${fact}"\nQuestion: "${whyQuestion}"\nStudent's answer: """${userAnswer}"""\n\n` +
    `Assess if the student's reasoning is correct. Give a model answer.\n` +
    `Return JSON only: {"correct": true, "feedback": "...", "modelAnswer": "..."}`;
  const system = 'You grade elaborative interrogation answers. JSON only.' + ageDirective(name, age);
  const text = await callClaude({ messages: [{ role: 'user', content: prompt }], system, max_tokens: 600 });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export interface WhyQuestion {
  fact: string;
  why: string;
}

export async function generateWhyQuestions(
  cards: Array<{ question: string; answer: string }>,
  name: string,
  age: number | null,
): Promise<WhyQuestion[] | null> {
  const facts = cards.slice(0, 8).map((c) => c.answer).join('\n- ');
  const prompt =
    `Facts from student's notes:\n- ${facts}\n\n` +
    `For each fact, write a "why" question that asks the student to explain the reason behind it.\n` +
    `Return JSON only: [{"fact": "...", "why": "Why does/is ...?"}]`;
  const system = 'You generate why questions for elaborative interrogation. JSON array only.' + ageDirective(name, age);
  const text = await callClaude({ messages: [{ role: 'user', content: prompt }], system, max_tokens: 1000 });
  if (!text) return null;
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export interface SelfExplainGradeResult {
  correct: boolean;
  feedback: string;
  simpler: string;
}

export async function gradeSelfExplain(
  chunk: string,
  userExplanation: string,
  name: string,
  age: number | null,
): Promise<SelfExplainGradeResult | null> {
  const prompt =
    `Original text: """${chunk}"""\nStudent's paraphrase: """${userExplanation}"""\n\n` +
    `Did they capture the key idea? Give feedback and a simpler one-sentence version.\n` +
    `Return JSON only: {"correct": true, "feedback": "...", "simpler": "..."}`;
  const system = 'You grade self-explanation paraphrases. JSON only.' + ageDirective(name, age);
  const text = await callClaude({ messages: [{ role: 'user', content: prompt }], system, max_tokens: 400 });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function gradePracticeTestSA(
  question: string,
  correctAnswer: string,
  userAnswer: string,
  name: string,
  age: number | null,
): Promise<{ correct: boolean; explanation: string } | null> {
  const prompt =
    `Question: "${question}"\nCorrect answer: "${correctAnswer}"\nStudent's answer: "${userAnswer}"\n\n` +
    `Is the student's answer correct? Return JSON only: {"correct": true, "explanation": "brief explanation"}`;
  const system = 'You grade short answer quiz questions. JSON only.' + ageDirective(name, age);
  const text = await callClaude({ messages: [{ role: 'user', content: prompt }], system, max_tokens: 300 });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
