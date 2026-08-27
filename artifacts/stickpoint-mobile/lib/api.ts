/**
 * Typed client for Stickpoint's purpose-built AI endpoints (/api/ai/*).
 *
 * Prompts and model choices live server-side; this file only shapes requests
 * and responses. Wrapper functions keep the signatures the components were
 * already written against.
 */

import { authToken } from './supabase';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '');

interface Student {
  name?: string;
  age?: number | null;
}

/** Fetch against our API with the auth token attached when signed in. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await authToken();
  return fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await apiFetch(`/ai${path}`, { method: 'POST', body: JSON.stringify(body) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Card extraction ─────────────────────────────────────────────────────────

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
  return post<ExtractResult>('/extract-cards', { material, name, age });
}

// ─── Blurting ────────────────────────────────────────────────────────────────

export interface BlurtGradeResult {
  covered: string[];
  missed: string[];
  scorePct: number;
  notesSection: string;
}

export async function blurtTopics(material: string, s: Student = {}): Promise<string[] | null> {
  const r = await post<{ topics: { topic: string }[] }>('/blurt-topics', { material, ...s });
  return r ? r.topics.map((t) => t.topic) : null;
}

export async function gradeBlurt(
  userText: string,
  notes: string,
  topicName: string,
  name: string,
  age: number | null,
): Promise<BlurtGradeResult | null> {
  const r = await post<{ notesSection: string; covered: string[]; missed: string[] }>(
    '/blurt-grade',
    { material: notes, topic: topicName, text: userText, name, age },
  );
  if (!r) return null;
  const total = Math.max(1, r.covered.length + r.missed.length);
  return { ...r, scorePct: Math.round((r.covered.length / total) * 100) };
}

// ─── Feynman ─────────────────────────────────────────────────────────────────

export interface FeynmanGradeResult {
  score: number; // 1-5
  feedback: string;
  simpler: string;
  gotRight: string;
  gap: string | null;
  jargon: { term: string; plain: string }[];
}

export async function feynmanConcepts(
  material: string,
  s: Student = {},
): Promise<{ concept: string; definition: string }[] | null> {
  const r = await post<{ items: { concept: string; definition: string }[] }>(
    '/feynman-concepts',
    { material, ...s },
  );
  return r ? r.items : null;
}

export async function gradeFeynman(
  conceptName: string,
  definition: string,
  userExplanation: string,
  name: string,
  age: number | null,
  opts: { material?: string; secondPass?: boolean; firstText?: string } = {},
): Promise<FeynmanGradeResult | null> {
  const r = await post<{
    score: number;
    gotRight: string;
    missed: string;
    gap: string;
    jargon: { term: string; plain: string }[];
    simpler: string;
  }>('/feynman-grade', {
    concept: conceptName,
    definition,
    text: userExplanation,
    name,
    age,
    ...opts,
  });
  if (!r) return null;
  return {
    score: r.score,
    feedback: r.missed || r.gotRight,
    simpler: r.simpler,
    gotRight: r.gotRight,
    gap: r.score >= 5 ? null : r.gap,
    jargon: r.jargon,
  };
}

// ─── Self-Explanation ────────────────────────────────────────────────────────

export interface SelfExplainGradeResult {
  correct: boolean;
  feedback: string;
  simpler: string;
}

export async function seChunks(
  material: string,
  s: Student = {},
): Promise<{ chunk: string; keyIdea: string }[] | null> {
  const r = await post<{ chunks: { chunk: string; keyIdea: string }[] }>('/se-chunks', {
    material,
    ...s,
  });
  return r ? r.chunks : null;
}

export async function gradeSelfExplain(
  chunk: string,
  userExplanation: string,
  name: string,
  age: number | null,
): Promise<SelfExplainGradeResult | null> {
  return post<SelfExplainGradeResult>('/se-grade', { chunk, explanation: userExplanation, name, age });
}

// ─── Elaborative Interrogation ───────────────────────────────────────────────

export interface EIItem {
  fact: string;
  plainEnglish: string;
  whyQuestion: string;
  connectionQuestion: string;
  modelAnswer: string;
  chain: string[];
  chainCaption: string;
  primerTerms: { term: string; means: string }[];
}

export type EIVerdict = 'correct' | 'partially_correct' | 'incorrect';

export async function eiGenerate(material: string, s: Student = {}): Promise<EIItem[] | null> {
  const r = await post<{ items: EIItem[] }>('/ei-generate', { material, ...s });
  return r ? r.items : null;
}

export async function eiGradeWhy(
  item: Pick<EIItem, 'fact' | 'whyQuestion' | 'modelAnswer'>,
  text: string,
  material: string,
  s: Student = {},
): Promise<{ verdict: EIVerdict; feedback: string } | null> {
  return post('/ei-grade-why', {
    fact: item.fact,
    whyQuestion: item.whyQuestion,
    modelAnswer: item.modelAnswer,
    text,
    material,
    ...s,
  });
}

export async function eiGradeConnection(
  item: Pick<EIItem, 'fact' | 'connectionQuestion'>,
  text: string,
  material: string,
  s: Student = {},
): Promise<{ verdict: EIVerdict; feedback: string; idealConnection: string } | null> {
  return post('/ei-grade-connection', {
    fact: item.fact,
    connectionQuestion: item.connectionQuestion,
    text,
    material,
    ...s,
  });
}

// ─── Concrete Examples ───────────────────────────────────────────────────────

export interface CEItem {
  concept: string;
  plainDefinition: string;
  example: string;
  sampleProblem: string;
  connectionQuestion: string;
}

export async function ceGenerate(material: string, s: Student = {}): Promise<CEItem[] | null> {
  const r = await post<{ items: CEItem[] }>('/ce-generate', { material, ...s });
  return r ? r.items : null;
}

export async function ceGrade(
  item: Pick<CEItem, 'concept' | 'plainDefinition' | 'example'>,
  text: string,
  s: Student = {},
): Promise<{ correct: boolean; gotRight: string; missed: string; reinforce: string } | null> {
  return post('/ce-grade', {
    concept: item.concept,
    plainDefinition: item.plainDefinition,
    example: item.example,
    text,
    ...s,
  });
}

export async function ceNewExample(
  item: Pick<CEItem, 'concept' | 'plainDefinition' | 'example'>,
  s: Student = {},
): Promise<string | null> {
  const r = await post<{ example: string }>('/ce-new-example', {
    concept: item.concept,
    plainDefinition: item.plainDefinition,
    example: item.example,
    ...s,
  });
  return r ? r.example : null;
}

// ─── Problem Sets ────────────────────────────────────────────────────────────

export interface PsStep {
  step: string;
  why: string;
}

export interface PsFigure {
  type: 'table' | 'chart' | 'diagram';
  headers?: string[];
  rows?: string[][];
  bars?: { label: string; value: number }[];
  art?: string;
  caption?: string;
}

export interface PsSkill {
  skill: string;
  worked: {
    problem: string;
    figure?: PsFigure | null;
    steps: PsStep[];
  };
  practice: {
    problem: string;
    answer: string;
    hint: string;
    figure?: PsFigure | null;
  }[];
}

export interface PsGenerateResult {
  skills: PsSkill[];
}

export async function generateProblemSets(
  material: string,
  name: string,
  age: number | null,
): Promise<PsGenerateResult | null | 'not_math'> {
  const r = await post<{ notMath: boolean; skills: PsSkill[] }>('/ps-generate', {
    material,
    name,
    age,
  });
  if (!r) return null;
  if (r.notMath) return 'not_math';
  return { skills: r.skills };
}

export interface PsGradeResult {
  errLine: number | null;
  errorType: string;
  explanation: string;
  correctLine: string;
  reached: boolean;
  lines: string[];
}

export async function gradeProblemStep(
  skillName: string,
  problem: string,
  correctAnswer: string,
  workLines: string[],
  name: string,
  age: number | null,
): Promise<PsGradeResult | null> {
  return post<PsGradeResult>('/ps-mark', {
    skill: skillName,
    problem,
    answer: correctAnswer,
    lines: workLines,
    name,
    age,
  });
}

// ─── Practice Testing ────────────────────────────────────────────────────────

export interface PTQuestion {
  question: string;
  type: 'multiple_choice' | 'true_or_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
}

export async function generatePracticeTest(
  material: string,
  s: Student = {},
): Promise<PTQuestion[] | null> {
  const r = await post<{ questions: PTQuestion[] }>('/pt-generate', { material, ...s });
  return r ? r.questions : null;
}

export async function gradePracticeTestSA(
  question: string,
  correctAnswer: string,
  userAnswer: string,
  name: string,
  age: number | null,
): Promise<{ correct: boolean; explanation: string } | null> {
  const r = await post<{ graded: { i: number; verdict: EIVerdict; explanation: string }[] }>(
    '/pt-grade-sa',
    {
      items: [{ i: 0, question, modelAnswer: correctAnswer, studentResponse: userAnswer }],
      name,
      age,
    },
  );
  const g = r?.graded.find((x) => x.i === 0);
  if (!g) return null;
  return { correct: g.verdict === 'correct', explanation: g.explanation };
}

// ─── Material ingestion (photo / PDF) ────────────────────────────────────────

export type TranscribeMediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'application/pdf';

/**
 * Transcribes a photo of notes (or a PDF) into plain text via the server's
 * vision endpoint. Distinguishes "the file was unreadable" from "the AI
 * service isn't reachable" so the UI can say the right thing.
 */
export type TranscribeResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'unreadable' | 'unavailable' };

export async function transcribeMaterial(
  base64Data: string,
  mediaType: TranscribeMediaType,
  s: Student = {},
): Promise<TranscribeResult> {
  try {
    const res = await apiFetch('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({ data: base64Data, mediaType, ...s }),
    });
    // 502 is the server saying "I reached Claude but the reply was
    // unusable" — that one genuinely means try a better photo.
    if (res.status === 502) return { ok: false, reason: 'unreadable' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // A static host answering for a missing API returns HTML.
      return { ok: false, reason: 'unavailable' };
    }
    const body = (await res.json()) as { text?: string };
    return body.text
      ? { ok: true, text: body.text }
      : { ok: false, reason: 'unreadable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

// ─── Pomodoro ────────────────────────────────────────────────────────────────

export async function pomodoroChunks(
  material: string,
  s: Student = {},
): Promise<{ chunks: { title: string; bullets: string[] }[]; funFacts: string[] } | null> {
  return post('/pomodoro-chunks', { material, ...s });
}
