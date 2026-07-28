// @ts-nocheck
import React from 'react';
import * as mod from './content';
import { css } from './utils';
import { WelcomeScreen } from './screens/Welcome';
import { TutorialScreen } from './screens/Tutorial';
import { QuizSubjectScreen } from './screens/QuizSubject';
import { QuizQuestionScreen } from './screens/QuizQuestion';
import { MaterialInputScreen } from './screens/MaterialInput';
import { ProcessingScreen } from './screens/Processing';
import { MethodTutorialScreen } from './screens/MethodTutorial';
import { ResultScreen } from './screens/Result';
import { AppScreen } from './screens/AppScreen';

const MASCOT = 'Chop';
const POMODORO_FOCUS = 25;

interface AppState {
  contentReady: boolean; screen: string; tutorialIdx: number; subjectId: string | null;
  ptHistory: any[]; library: any[]; currentMaterialId: string | null; isMath: boolean; mathNoticeOpen: boolean;
  renamingId: string | null; renameDraft: string; missedBank: any[]; account: string | null;
  accountPrompted: boolean; accountDraft: string; sessionsFinished: number; photoStatusText: string;
  quizIdx: number; quizAnswers: any[]; name: string; nameDraft: string; age: number | null; ageDraft: string;
  ageEditDraft: string; restartOpen: boolean; editingName: boolean; nameEditDraft: string;
  topMethods: string[]; scores: Record<string, number>; xp: number; streak: number; badges: string[];
  methodsTried: Record<string, boolean>; materialMode: string; materialDraft: string; material: string;
  pdfStatusText: string; concepts: any[]; topic: string; tab: string; session: Record<string, any>;
  studiedDates: string[]; testDate: string | null; calendarMode: string; toast: string | null;
  calMonthOffset: number; activeMethod: string | null; pendingMethod: string | null;
  extracting: boolean; extractError: boolean; extractStartedAt: number; extractNow: number;
  fromApp: boolean; aiDown: boolean; showAccount: boolean; askAge: boolean;
  bootFailed: boolean; showRestartFloat?: boolean; materialCameFromApp?: boolean;
}

class App extends React.Component<{}, AppState> {
  blurtTimer: any = null;
  extractTick: any = null;
  pomodoroInterval: any = null;
  ptTimer: any = null;
  beforeUnloadHandler: any = null;

  state: AppState = {
    contentReady: false, screen: 'welcome', tutorialIdx: 0, subjectId: null,
    ptHistory: [], library: [], currentMaterialId: null, isMath: false, mathNoticeOpen: false,
    renamingId: null, renameDraft: '', missedBank: [], account: null,
    accountPrompted: false, accountDraft: '', sessionsFinished: 0, photoStatusText: 'No photo chosen yet',
    quizIdx: 0, quizAnswers: [], name: '', nameDraft: '', age: null, ageDraft: '',
    ageEditDraft: '', restartOpen: false, editingName: false, nameEditDraft: '',
    topMethods: [], scores: {}, xp: 0, streak: 0, badges: [],
    methodsTried: {}, materialMode: 'paste', materialDraft: '', material: '',
    pdfStatusText: 'No PDF chosen yet', pdfLoading: false, photoLoading: false, concepts: [], topic: '', tab: 'today',
    session: {}, studiedDates: [], testDate: null, calendarMode: 'studied', toast: null,
    calMonthOffset: 0, activeMethod: null, pendingMethod: null,
    extracting: false, extractError: false, extractStartedAt: 0, extractNow: 0,
    fromApp: false, aiDown: false, showAccount: false, askAge: false, bootFailed: false,
  };

  // ---- Setup ----
  componentDidMount() {
    this.setupClaude();
    this.boot();
    this.startBlurtInterval();
    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      const pom = this.state.session && this.state.session.pomodoro;
      if (this.state.activeMethod === 'pomodoro' && pom && pom.phase === 'study') {
        e.preventDefault(); e.returnValue = 'Your Pomodoro session is running, are you sure?';
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  componentWillUnmount() {
    if (this.blurtTimer) clearInterval(this.blurtTimer);
    if (this.extractTick) clearInterval(this.extractTick);
    if (this.pomodoroInterval) clearInterval(this.pomodoroInterval);
    if (this.ptTimer) clearInterval(this.ptTimer);
    if (this.beforeUnloadHandler) window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  setupClaude() {
    if ((window as any).claude?.complete) return;
    (window as any).claude = {
      key: {
        get: () => { try { return localStorage.getItem('stickpoint_api_key') || ''; } catch { return ''; } },
        set: (k: string) => { try { k ? localStorage.setItem('stickpoint_api_key', k) : localStorage.removeItem('stickpoint_api_key'); } catch {} },
      },
      complete: async (opts: any) => {
        const key = (window as any).claude.key.get();
        if (key) {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: opts.max_tokens || 8000, system: opts.system, messages: opts.messages }),
          });
          const data = await res.json();
          return data?.content?.[0]?.text ?? null;
        } else {
          const res = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(opts),
          });
          const data = await res.json();
          return data?.content ?? null;
        }
      },
    };
  }

  async boot() {
    let persisted: any = null;
    try { persisted = JSON.parse(localStorage.getItem('stickpoint_v1') || 'null'); } catch (e) {}
    if (persisted && persisted.name) {
      const safe: any = Object.assign({ contentReady: true, session: {} }, persisted);
      if (Array.isArray(safe.topMethods)) safe.topMethods = safe.topMethods.map((m: string) => m === 'confidence_rating' ? 'self_explanation' : m);
      if (safe.activeMethod === 'confidence_rating') safe.activeMethod = 'self_explanation';
      if (safe.scores && safe.scores.confidence_rating != null) { safe.scores = Object.assign({}, safe.scores); safe.scores.self_explanation = safe.scores.confidence_rating; delete safe.scores.confidence_rating; }
      if (safe.methodsTried && safe.methodsTried.confidence_rating) { safe.methodsTried = Object.assign({}, safe.methodsTried); safe.methodsTried.self_explanation = true; delete safe.methodsTried.confidence_rating; }
      if (safe.material && safe.isMath == null) {
        const t = (safe.topic || '') + ' ' + safe.material.slice(0, 2500);
        safe.isMath = safe.subjectId === 'math_science' || /\b(equation|solve|calculate|theorem|triangle|angle|derivative|integral|fraction|graph|formula|congruent|proof|algebra|geometry|trigonometr|quadratic|polynomial|sine|cosine|probability|vector|matrix)\b/i.test(t) || /[=<>≤≥±√π∫]|\d+\s*[\+\-\*\/\^]\s*\d+|\bx\s*=|\^2/.test(t);
      }
      if (safe.name && safe.age == null) safe.askAge = true;
      if (Array.isArray(safe.missedBank) && safe.missedBank.length) safe.missedBank = safe.missedBank.map((b: any) => Object.assign({}, b, { answer: String(b.answer || '').replace(/^\s*[A-Da-d][.)]\s+/, '').trim() }));
      if (safe.material && (!safe.library || !safe.library.length)) {
        const id = 'm' + (safe.savedAt || Date.now());
        safe.library = [{ id, name: safe.topic || 'My notes', material: safe.material, concepts: safe.concepts || [], topic: safe.topic, isMath: !!safe.isMath, savedAt: Date.now() }];
        safe.currentMaterialId = id;
      }
      if ((safe.screen === 'app' || safe.screen === 'methodTutorial') && (!safe.concepts || !safe.concepts.length || !safe.topMethods || !safe.topMethods.length)) safe.screen = 'welcome';
      const resumeExtract = safe.screen === 'processing';
      if (resumeExtract) { safe.extracting = true; safe.extractError = false; }
      this.setState(safe, () => {
        if (this.state.screen === 'app' && this.state.activeMethod) this.ensureSession(this.state.activeMethod);
        if (resumeExtract) {
          if ((this.state.material || '').trim().length >= 40) { this.startExtractCountdown(); this.extractConcepts(this.state.material); }
          else this.update({ screen: 'material', extracting: false, extractError: false });
        }
      });
    } else {
      this.setState({ contentReady: true });
    }
  }

  persist(extra?: any) {
    const s: any = Object.assign({}, this.state, extra || {});
    const toSave = { screen: s.screen, name: s.name, topMethods: s.topMethods, scores: s.scores, xp: s.xp, streak: s.streak, badges: s.badges, methodsTried: s.methodsTried, age: s.age, askAge: s.askAge, subjectId: s.subjectId, material: s.material, concepts: s.concepts, topic: s.topic, ptHistory: s.ptHistory, activeMethod: s.activeMethod, studiedDates: s.studiedDates, testDate: s.testDate, library: s.library, currentMaterialId: s.currentMaterialId, isMath: s.isMath, missedBank: s.missedBank, account: s.account, accountPrompted: s.accountPrompted, sessionsFinished: s.sessionsFinished, tab: s.tab };
    try { localStorage.setItem('stickpoint_v1', JSON.stringify(toSave)); } catch (e) {}
  }

  update(patch: any) { this.setState(patch); setTimeout(() => this.persist(), 0); }

  setSession(method: string, patch: any) {
    const session = Object.assign({}, this.state.session);
    session[method] = Object.assign({}, session[method] || {}, patch);
    this.setState({ session });
  }

  // ---- Missed items / spaced repetition ----
  static SR_DAYS = [1, 2, 4, 7, 14];
  dayKey(ts: number) { const d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  dueAtFor(box: number) { return Date.now() + (App.SR_DAYS[Math.min(box, App.SR_DAYS.length - 1)] || 1) * 86400000; }

  recordMissed(items: any[], source: string) {
    if (!items || !items.length) return;
    const bank = (this.state.missedBank || []).slice();
    items.forEach(it => {
      const q = String(it.question || '').trim(); const a = String(it.answer || '').trim();
      if (!q || !a) return;
      const key = q.toLowerCase().slice(0, 120);
      const found = bank.find((b: any) => b.key === key);
      if (found) { found.box = 0; found.dueAt = this.dueAtFor(0); }
      else if (bank.length < 200) bank.push({ key, question: q, answer: a, source: source || '', box: 0, dueAt: this.dueAtFor(0) });
    });
    this.update({ missedBank: bank });
  }

  addXp(n: number) { this.update({ xp: (this.state.xp || 0) + n }); }
  markStudiedToday() {
    const today = this.dayKey(Date.now());
    if (this.state.studiedDates.includes(today)) return;
    const dates = this.state.studiedDates.concat(today);
    const yesterday = this.dayKey(Date.now() - 86400000);
    const hadYesterday = this.state.studiedDates.includes(yesterday);
    const newStreak = hadYesterday ? (this.state.streak || 0) + 1 : 1;
    this.update({ studiedDates: dates, streak: newStreak });
  }

  // ---- Welcome ----
  onNameInput = (e: any) => this.setState({ nameDraft: e.target.value });
  onAgeInput = (e: any) => this.setState({ ageDraft: e.target.value });
  submitName = () => {
    const n = (this.state.nameDraft || '').trim();
    const a = parseInt(this.state.ageDraft, 10);
    if (!n || !(a >= 5 && a <= 99)) return;
    this.update({ name: n, age: a, screen: 'tutorial', tutorialIdx: 0 });
  };

  // ---- Tutorial ----
  tutorialSlides = [
    { title: 'PASTE YOUR NOTES', body: `Drop in your notes, a chapter, or a PDF. ${MASCOT}'s AI turns it into study material, no retyping.` },
    { title: 'TAKE THE QUIZ', body: `7 quick questions about how you study. ${MASCOT} finds the method that fits YOUR brain, not a generic one.` },
    { title: 'STUDY & LEVEL UP', body: `Study with your method, earn XP, keep your streak alive, and try other methods anytime.` },
  ];
  tutorialNext = () => {
    if (this.state.tutorialIdx < this.tutorialSlides.length - 1) this.setState({ tutorialIdx: this.state.tutorialIdx + 1 });
    else this.setState({ screen: 'quizSubject' });
  };
  tutorialBack = () => { if (this.state.tutorialIdx > 0) this.setState({ tutorialIdx: this.state.tutorialIdx - 1 }); };

  // ---- Quiz ----
  pickSubject = (id: string) => this.setState({ subjectId: id, screen: 'quizQuestion', quizIdx: 0 });
  pickQuizOption = (optIdx: number) => {
    const answers = (this.state.quizAnswers || []).slice(); while (answers.length <= this.state.quizIdx) answers.push(null);
    const cur = answers[this.state.quizIdx];
    const list = cur == null ? [] : Array.isArray(cur) ? cur : [cur];
    const at = list.indexOf(optIdx);
    let next;
    if (at >= 0) next = list.filter((i: number) => i !== optIdx);
    else if (list.length < 2) next = list.concat(optIdx);
    else next = [list[1], optIdx];
    answers[this.state.quizIdx] = next.length === 0 ? null : next.length === 1 ? next[0] : next;
    this.setState({ quizAnswers: answers });
  };
  quizNext = () => {
    if (this.state.quizAnswers[this.state.quizIdx] == null) return;
    const nextIdx = this.state.quizIdx + 1;
    if (nextIdx >= mod.QUIZ_QUESTIONS.length) {
      const { scores, ranked } = mod.scoreQuiz(this.state.subjectId, this.state.quizAnswers);
      this.update({ scores, topMethods: ranked.slice(0, 3), screen: 'result', xp: this.state.xp + 10 });
    } else { this.setState({ quizIdx: nextIdx }); }
  };
  quizBack = () => { if (this.state.quizIdx === 0) this.setState({ screen: 'quizSubject' }); else this.setState({ quizIdx: this.state.quizIdx - 1 }); };
  goToMaterial = () => this.update({ screen: 'material', materialCameFromApp: false });

  // ---- Material input ----
  setMaterialModePaste = () => this.setState({ materialMode: 'paste' });
  setMaterialModePdf = () => this.setState({ materialMode: 'pdf' });
  setMaterialModePhoto = () => this.setState({ materialMode: 'photo' });
  onMaterialInput = (e: any) => this.setState({ materialDraft: e.target.value });
  backToApp = () => this.setState({ screen: 'app' });

  // Async, off-main-thread base64 via FileReader — never blocks the UI
  fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  onPdfChosen = async (e: any) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    this.setState({ pdfLoading: true, pdfStatusText: 'Reading PDF…' });
    try {
      const b64 = await this.fileToBase64(file);
      // Go straight to the processing screen and run a single combined call
      this.update({ pdfLoading: false, pdfStatusText: 'PDF loaded ✓', screen: 'processing', extracting: true, extractError: false, materialCameFromApp: this.state.fromApp || this.state.materialCameFromApp });
      this.startExtractCountdown();
      this.extractConceptsFromFile({ type: 'pdf', b64, mediaType: file.type || 'application/pdf' });
    } catch {
      this.setState({ pdfLoading: false, pdfStatusText: 'Could not read that PDF. Try pasting the text instead.' });
    }
  };

  onPhotoChosen = async (e: any) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    this.setState({ photoLoading: true, photoStatusText: 'Reading photo…' });
    try {
      const b64 = await this.fileToBase64(file);
      this.update({ photoLoading: false, photoStatusText: 'Photo loaded ✓', screen: 'processing', extracting: true, extractError: false, materialCameFromApp: this.state.fromApp || this.state.materialCameFromApp });
      this.startExtractCountdown();
      this.extractConceptsFromFile({ type: 'image', b64, mediaType: file.type || 'image/jpeg' });
    } catch {
      this.setState({ photoLoading: false, photoStatusText: 'Could not read that photo.' });
    }
  };

  submitMaterial = () => {
    const text = (this.state.materialDraft || '').trim();
    if (text.length < 40) return;
    this.update({ material: text, screen: 'processing', extracting: true, extractError: false, materialCameFromApp: this.state.fromApp || this.state.materialCameFromApp });
    this.startExtractCountdown();
    this.extractConcepts(text);
  };

  // ---- AI / extraction ----
  aiUnavailable() { return this.state.aiDown === true || !(window as any).claude?.complete; }
  offlineMode() { return this.aiUnavailable(); }

  async callAI(prompt: string, system: string): Promise<string | null> {
    try {
      if (!(window as any).claude?.complete) { this.setState({ aiDown: true }); return null; }
      const call = (window as any).claude.complete({ messages: [{ role: 'user', content: prompt }], system: (system || '') + this.ageDirective(), max_tokens: 8000 });
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 45000));
      const out = await Promise.race([call, timeout]);
      if (out == null) this.setState({ aiDown: true });
      return out;
    } catch (e) { this.setState({ aiDown: true }); return null; }
  }

  ageDirective() {
    const a = this.state.age;
    if (!a) return '';
    let band = '';
    if (a <= 11) band = `They are ${a}, in elementary school. Short words. Real-life examples from cartoons, games, family.`;
    else if (a <= 14) band = `They are ${a}, in middle school. Casual tone, examples from school, sports, social media.`;
    else if (a <= 18) band = `They are ${a}, in high school. Full technical vocabulary is fine as long as defined once.`;
    else if (a <= 22) band = `They are ${a}, a university student. Assume solid background knowledge.`;
    else band = `They are ${a}, an adult learner. Use precise terminology.`;
    return `\n\nAUDIENCE: You are writing for a student named ${this.state.name || 'the student'}. ${band}\nMatch that level exactly. Never use em dashes.`;
  }

  parseJson(raw: string | null): any {
    if (!raw) return null;
    try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch {}
    const m = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }

  startExtractCountdown() {
    this.setState({ extractStartedAt: Date.now(), extractNow: Date.now() });
    if (this.extractTick) clearInterval(this.extractTick);
    this.extractTick = setInterval(() => {
      if (!this.state.extracting) { clearInterval(this.extractTick); this.extractTick = null; return; }
      this.setState({ extractNow: Date.now() });
    }, 1000);
  }

  retryExtract = () => { this.update({ extracting: true, extractError: false }); this.startExtractCountdown(); this.extractConcepts(this.state.material); };
  cancelExtractToMaterial = () => this.update({ screen: 'material', extracting: false, extractError: false });

  async extractConcepts(materialText: string) {
    const rawMaterial = String(materialText || (this.state.material || '')).trim();
    if (rawMaterial.length < 40) { this.update({ extracting: false, extractError: true }); return; }
    const material = rawMaterial.replace(/\r/g, '\n').replace(/[ \t]{2,}/g, ' ').split('\n').filter((l: string) => !/^\s*(page\s*)?\d{1,3}\s*$/i.test(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const prompt = `Here is a student's study material:\n\n"""${material.slice(0, 6000)}"""\n\nRead these notes carefully and identify every individual vocabulary word, key concept, important person, significant date, and core idea. Create one flashcard for EACH one you find. Return between 8 and 20 cards.\n\nSet "is_math" to true ONLY if the material is primarily mathematics or physics calculations (algebra, calculus, statistics, geometry, equations). Psychology, biology, history, literature, chemistry concepts, social sciences, and any other subject = false.\n\nReturn JSON only:\n{"topic": "short topic name, 4-6 words", "is_math": true or false, "cards": [{"question": "...", "answer": "...", "methodTag": "one of: active_recall, blurting, practice_testing, feynman, concrete_examples, pomodoro, self_explanation, elaborative_interrogation"}]}`;
    const system = 'You are a study assistant that turns student notes into individual study cards. Respond with ONLY valid JSON, no markdown fences, no extra text. Never use em dashes.';
    let parsed: any = null;
    for (let attempt = 0; attempt < 2 && !(parsed && mod.isValidCards(parsed.cards)); attempt++) {
      const ask = attempt === 0 ? prompt : prompt + '\n\nIMPORTANT: Return ONLY the raw JSON object.';
      const raw = await this.callAI(ask, system);
      const p = this.parseJson(raw);
      if (p && mod.isValidCards(p.cards)) { parsed = p; break; }
      if (p) parsed = p;
    }
    const cardsValid = parsed && mod.isValidCards(parsed.cards);
    if (!cardsValid) {
      if (this.aiUnavailable()) { parsed = { topic: mod.localTopic(material), is_math: false, cards: mod.localExtractCards(material) }; }
      else { this.update({ extracting: false, extractError: true }); return; }
    }
    const cards = mod.buildFlashcards(parsed.cards);
    const isMath = !!(parsed.is_math || parsed.isMath) || this.state.subjectId === 'math_science';
    this.saveToLibrary({ cards, topic: parsed.topic, is_math: isMath });
    this.update({ concepts: cards, topic: parsed.topic, isMath, screen: 'app', tab: 'today', session: {}, fromApp: false, extracting: false, extractError: false });
    if (isMath) setTimeout(() => this.setState({ mathNoticeOpen: true }), 300);
  }

  // ---- PDF/photo direct extraction (single Claude call, no blocking) ----
  async extractConceptsFromFile({ type, b64, mediaType }: { type: 'pdf' | 'image'; b64: string; mediaType: string }) {
    if (!(window as any).claude?.complete) {
      this.update({ extracting: false, extractError: true });
      return;
    }

    const contentPart = type === 'pdf'
      ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: b64 } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } };

    const prompt = `Read every piece of text in this ${type === 'pdf' ? 'PDF document' : 'image'} carefully.

Step 1 — extract ALL text from the document verbatim into "raw_text".
Step 2 — from that text, identify every vocabulary word, key concept, important person, significant date, and core idea. Create one flashcard per item. Return 8–20 cards.
Step 3 — set "is_math" to true ONLY if the content is primarily mathematics or physics calculations (algebra, calculus, statistics, geometry, equations). Psychology, biology, history, literature, chemistry concepts, and social sciences = false.

Return ONLY valid JSON — no markdown, no extra text:
{"topic": "short topic name 4-6 words", "is_math": true or false, "raw_text": "full extracted text from the document", "cards": [{"question": "...", "answer": "...", "methodTag": "one of: active_recall, blurting, practice_testing, feynman, concrete_examples, pomodoro, self_explanation, elaborative_interrogation"}]}`;

    const system = 'You are a study assistant. Read the attached file and produce study flashcards as JSON. Return ONLY valid JSON, no markdown, no extra text. Never use em dashes.';

    let parsed: any = null;
    for (let attempt = 0; attempt < 2 && !(parsed && mod.isValidCards(parsed?.cards)); attempt++) {
      try {
        const raw = await (window as any).claude.complete({
          messages: [{ role: 'user', content: [contentPart, { type: 'text', text: attempt === 0 ? prompt : prompt + '\n\nReturn ONLY the raw JSON object, starting with {' }] }],
          system: system + this.ageDirective(),
          max_tokens: 8000,
        });
        const p = this.parseJson(typeof raw === 'string' ? raw : null);
        if (p && mod.isValidCards(p.cards)) { parsed = p; break; }
        if (p) parsed = p;
      } catch { break; }
    }

    const cardsValid = parsed && mod.isValidCards(parsed.cards);
    if (!cardsValid) {
      this.update({ extracting: false, extractError: true });
      return;
    }

    const cards = mod.buildFlashcards(parsed.cards);
    const isMath = !!(parsed.is_math || parsed.isMath) || this.state.subjectId === 'math_science';
    // Save the raw extracted text so all study methods can reference the actual material
    const rawText = typeof parsed.raw_text === 'string' && parsed.raw_text.trim().length > 40 ? parsed.raw_text.trim() : '';
    this.saveToLibrary({ cards, topic: parsed.topic, is_math: isMath });
    this.update({ concepts: cards, topic: parsed.topic, isMath, material: rawText, materialDraft: rawText, screen: 'app', tab: 'today', session: {}, fromApp: false, extracting: false, extractError: false });
    if (isMath) setTimeout(() => this.setState({ mathNoticeOpen: true }), 300);
  }

  // ---- Restart / name edit ----
  openRestart = () => this.setState({ restartOpen: true });
  closeRestart = () => this.setState({ restartOpen: false });
  confirmRestart = () => {
    try { localStorage.removeItem('stickpoint_v1'); } catch {}
    this.clearPomodoroTimer();
    if (this.ptTimer) { clearInterval(this.ptTimer); this.ptTimer = null; }
    this.setState({ restartOpen: false, screen: 'welcome', name: '', nameDraft: '', age: null, ageDraft: '', ageEditDraft: '', tutorialIdx: 0, subjectId: null, quizIdx: 0, quizAnswers: [], topMethods: [], scores: {}, xp: 0, streak: 0, badges: [], methodsTried: {}, materialMode: 'paste', materialDraft: '', material: '', concepts: [], topic: '', activeMethod: null, studiedDates: [], testDate: null, session: {}, tab: 'today', extracting: false, extractError: false, ptHistory: [], editingName: false, nameEditDraft: '', missedBank: [], account: null, accountPrompted: false, accountDraft: '', sessionsFinished: 0, showAccount: false, photoStatusText: 'No photo chosen yet', library: [], currentMaterialId: null, isMath: false });
  };
  startEditName = () => this.setState({ editingName: true, nameEditDraft: this.state.name, ageEditDraft: this.state.age == null ? '' : String(this.state.age) });
  onNameEditInput = (e: any) => this.setState({ nameEditDraft: e.target.value });
  onAgeEditInput = (e: any) => this.setState({ ageEditDraft: e.target.value });
  saveNameEdit = () => {
    const n = (this.state.nameEditDraft || '').trim(); if (!n) return;
    const a = parseInt(this.state.ageEditDraft, 10);
    this.setState({ editingName: false });
    this.update(a >= 5 && a <= 99 ? { name: n, age: a } : { name: n });
  };

  // ---- Study session helpers ----
  ensureSession(method: string) {
    if (this.state.session[method]) return;
    const session = Object.assign({}, this.state.session);
    if (method === 'active_recall') {
      const cards = mod.buildFlashcards(this.state.concepts || []);
      session.active_recall = { queue: cards.map((_: any, i: number) => i), flipped: false, counts: { easy: 0, medium: 0, hard: 0 }, seenCount: {}, finished: false, cards };
    } else if (method === 'blurting') {
      session.blurting = { phase: null };
    } else if (method === 'practice_testing') {
      session.practice_testing = { phase: 'gen' };
      this.generatePracticeTest();
    } else if (method === 'elaborative_interrogation') {
      session.elaborative_interrogation = { phase: 'gen' };
      this.generateElaborativeItems();
    } else if (method === 'concrete_examples') {
      session.concrete_examples = { phase: 'gen' };
      this.generateConcreteExamples();
    } else if (method === 'self_explanation') {
      session.self_explanation = { phase: 'read', idx: 0 };
      this.initSelfExplanation();
    } else if (method === 'problem_sets') {
      session.problem_sets = { phase: 'gen' };
      this.generateProblemSets();
    } else if (method === 'feynman') {
      session.feynman = { phase: 'gen' };
      this.generateFeynman();
    } else if (method === 'chunking') {
      session.chunking = { phase: 'gen' };
      this.generateChunking();
    } else if (method === 'pomodoro') {
      session.pomodoro = { phase: 'idle', pomIdx: 0, elapsed: 0, focusMinutes: POMODORO_FOCUS };
    }
    this.setState({ session });
  }

  pickMethod = (id: string) => {
    const info = mod.METHODS.find((m: any) => m.id === id);
    if (!info) return;
    if (!this.state.concepts || !this.state.concepts.length) { this.setState({ screen: 'material', materialMode: 'paste', materialDraft: '' }); return; }
    this.setState({ pendingMethod: id, screen: 'methodTutorial' });
  };

  startStudying = () => {
    const id = this.state.pendingMethod;
    if (!id) return;
    const badges = Object.assign({}, this.state.methodsTried);
    badges[id] = true;
    this.update({ activeMethod: id, tab: 'study', badges, screen: 'app' });
    this.ensureSession(id);
  };

  switchMethod = (id: string) => {
    if (!this.state.concepts || !this.state.concepts.length) { this.setState({ screen: 'material' }); return; }
    const badges = Object.assign({}, this.state.methodsTried); badges[id] = true;
    this.update({ activeMethod: id, tab: 'study', badges });
    this.ensureSession(id);
  };

  goTabToday = () => this.update({ tab: 'today' });
  goTabStudy = () => { if (this.state.activeMethod) this.update({ tab: 'study' }); else this.update({ tab: 'today' }); };
  goTabProgress = () => this.update({ tab: 'progress' });
  goTabCalendar = () => this.update({ tab: 'calendar' });
  goTabMaterial = () => this.update({ tab: 'material' });

  // ---- Active recall ----
  sendCardsToActiveRecall(cards: any[]) {
    const session = Object.assign({}, this.state.session);
    session.active_recall = { queue: cards.map((_: any, i: number) => i), flipped: false, counts: { easy: 0, medium: 0, hard: 0 }, seenCount: {}, finished: false, customCards: cards };
    this.setState({ session }); this.update({ activeMethod: 'active_recall' });
  }

  arFlip = () => this.setSession('active_recall', { flipped: true });
  arRate = (rating: string) => {
    const sess = this.state.session.active_recall; if (!sess) return;
    const cards = sess.customCards || mod.buildFlashcards(this.state.concepts || []);
    const queue = (sess.queue || []).slice(); const cur = queue.shift();
    const counts = Object.assign({ easy: 0, medium: 0, hard: 0 }, sess.counts);
    counts[rating] = (counts[rating] || 0) + 1;
    const seenCount = Object.assign({}, sess.seenCount);
    seenCount[cur] = (seenCount[cur] || 0) + 1;
    if (rating === 'hard') queue.push(cur);
    const finished = queue.length === 0;
    if (rating === 'hard') this.recordMissed([cards[cur]], 'active_recall');
    if (finished) { this.addXp(10); this.markStudiedToday(); }
    this.setSession('active_recall', { queue, flipped: false, counts, seenCount, finished });
  };
  arRestart = () => { const cards = mod.buildFlashcards(this.state.concepts || []); this.setSession('active_recall', { queue: cards.map((_: any, i: number) => i), flipped: false, counts: { easy: 0, medium: 0, hard: 0 }, seenCount: {}, finished: false }); };

  // ---- Blurting ----
  setBlurtText = (v: string) => this.setSession('blurting', { text: v });
  startBlurtInterval() {
    if (this.blurtTimer) return;
    this.blurtTimer = setInterval(() => {
      const sess = this.state.session && this.state.session.blurting;
      if (!sess || sess.phase !== 'write' || this.state.activeMethod !== 'blurting' || this.state.screen !== 'app') return;
      this.setSession('blurting', { elapsed: Math.max(0, Math.floor((Date.now() - (sess.startedAt || Date.now())) / 1000)) });
    }, 1000);
  }

  extractBlurtTopics = async () => {
    this.setSession('blurting', { phase: 'topics' });
    const prompt = `Here are a student's study notes:\n\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nIdentify the 5 to 10 most important topics. Return ONLY a JSON array: [{"topic": "name"}, ...]`;
    const raw = await this.callAI(prompt, 'You extract topic names. Respond with ONLY a valid JSON array.');
    let topics: any[] | null = null;
    if (raw) { try { const p = JSON.parse(raw.replace(/```json|```/g, '').trim()); if (Array.isArray(p)) topics = p.filter((t: any) => t && typeof t.topic === 'string').map((t: any) => ({ topic: t.topic.trim() })).slice(0, 10); } catch {} }
    if ((!topics || !topics.length) && this.offlineMode()) topics = (this.state.concepts || []).slice(0, 8).map((c: any) => ({ topic: c.question }));
    if (!topics || !topics.length) { this.setSession('blurting', { phase: 'topicsError' }); return; }
    this.setSession('blurting', { phase: 'write', topics, idx: 0, text: '', result: null, prevScore: null, scores: {}, gradeError: false, startedAt: Date.now(), elapsed: 0 });
  };

  submitBlurt = async () => {
    const sess = this.state.session.blurting;
    if (!sess || sess.phase !== 'write' || (sess.text || '').trim().length <= 10) return;
    const topic = sess.topics[sess.idx].topic;
    this.setSession('blurting', { phase: 'grading', gradeError: false });
    const prompt = `A student is doing a blurting exercise on the topic: "${topic}".\n\nStudy notes:\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nStudent's blurt:\n"""${sess.text}"""\n\nReturn ONLY JSON: {"notesSection": "relevant portion of notes", "covered": ["key terms mentioned"], "missed": ["key terms not mentioned"]}`;
    const raw = await this.callAI(prompt, 'You compare free recall against study notes. Respond with ONLY valid JSON.');
    let result: any = null;
    if (raw) { try { const p = JSON.parse(raw.replace(/```json|```/g, '').trim()); if (p && Array.isArray(p.covered) && Array.isArray(p.missed)) result = { notesSection: typeof p.notesSection === 'string' ? p.notesSection : (this.state.material || '').slice(0, 800), covered: p.covered.filter((x: any) => typeof x === 'string'), missed: p.missed.filter((x: any) => typeof x === 'string') }; } catch {} }
    if (!result && this.offlineMode()) { const fb = mod.keywordOverlapFeedback(this.state.concepts || [], sess.text); result = { notesSection: (this.state.material || '').slice(0, 800), covered: fb.covered.map((c: any) => c.answer), missed: fb.missed.map((c: any) => c.answer) }; }
    if (!result) { this.setSession('blurting', { phase: 'write', gradeError: true }); return; }
    const total = result.covered.length + result.missed.length;
    const scores = Object.assign({}, sess.scores); scores[sess.idx] = { covered: result.covered.length, total };
    this.setSession('blurting', { phase: 'compare', result, scores });
    this.addXp(5); this.markStudiedToday();
    this.recordMissed(result.missed.map((m: string) => ({ question: 'Explain: ' + m, answer: m })), 'blurting');
  };

  tryTopicAgain = () => {
    const sess = this.state.session.blurting;
    const prevScore = sess.scores ? sess.scores[sess.idx] : null;
    this.setSession('blurting', { phase: 'write', text: '', result: null, prevScore, gradeError: false, startedAt: Date.now(), elapsed: 0 });
  };
  nextBlurtTopic = () => {
    const sess = this.state.session.blurting;
    if (sess.idx + 1 >= (sess.topics || []).length) { this.setSession('blurting', { phase: 'summary' }); this.addXp(5); }
    else this.setSession('blurting', { idx: sess.idx + 1, phase: 'write', text: '', result: null, prevScore: null, gradeError: false, startedAt: Date.now(), elapsed: 0 });
  };
  restartBlurting = () => this.setSession('blurting', { phase: null });

  // ---- Pomodoro ----
  clearPomodoroTimer() { if (this.pomodoroInterval) { clearInterval(this.pomodoroInterval); this.pomodoroInterval = null; } }
  startPomodoro = () => {
    const sess = this.state.session.pomodoro || {};
    this.setSession('pomodoro', { phase: 'study', startedAt: Date.now(), elapsed: 0, focusMinutes: POMODORO_FOCUS, focusInput: '', pomIdx: sess.pomIdx || 0 });
    this.clearPomodoroTimer();
    this.pomodoroInterval = setInterval(() => {
      const s = this.state.session.pomodoro;
      if (!s || s.phase !== 'study') { clearInterval(this.pomodoroInterval); this.pomodoroInterval = null; return; }
      const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
      const limit = (POMODORO_FOCUS * 60);
      if (elapsed >= limit) { clearInterval(this.pomodoroInterval); this.pomodoroInterval = null; this.setSession('pomodoro', { phase: 'check', elapsed: limit }); this.addXp(8); this.markStudiedToday(); }
      else this.setSession('pomodoro', { elapsed });
    }, 1000);
  };
  pausePomodoro = () => { this.clearPomodoroTimer(); this.setSession('pomodoro', { phase: 'paused', pausedAt: Date.now() }); };
  resumePomodoro = () => {
    const sess = this.state.session.pomodoro;
    const pauseDuration = Date.now() - (sess.pausedAt || Date.now());
    this.setSession('pomodoro', { phase: 'study', startedAt: (sess.startedAt || Date.now()) + pauseDuration });
    this.startPomodoro();
  };
  setPomFocusInput = (e: any) => this.setSession('pomodoro', { focusInput: e.target.value });
  submitPomCheck = () => {
    const sess = this.state.session.pomodoro;
    const pomIdx = (sess.pomIdx || 0) + 1;
    if (pomIdx % 4 === 0) this.setSession('pomodoro', { phase: 'longBreak', pomIdx });
    else this.setSession('pomodoro', { phase: 'break', pomIdx });
  };
  startBreak = () => this.setSession('pomodoro', { phase: 'breaking', breakStartedAt: Date.now(), breakElapsed: 0 });
  endBreak = () => this.setSession('pomodoro', { phase: 'idle' });

  // ---- Elaborative interrogation ----
  generateElaborativeItems = async () => {
    this.setSession('elaborative_interrogation', { phase: 'gen' });
    const prompt = `Here are a student's study notes:\n\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nFor each key fact, generate a why/how question and a connection question. Return ONLY a JSON array (6-10 items) where each has: "fact", "why_question", "connection_question", "model_answer", "chain" (array of 3-4 short step labels), "chain_caption", "primer", "primer_terms" (array of {term, means}).`;
    const p = this.parseJson(await this.callAI(prompt, 'You write elaborative-interrogation questions. Respond with ONLY a valid JSON array.'));
    let items = Array.isArray(p) ? p.filter((x: any) => x && x.fact && x.why_question && x.connection_question && x.model_answer).slice(0, 10) : null;
    if ((!items || !items.length) && this.offlineMode()) items = (this.state.concepts || []).slice(0, 6).map((c: any) => ({ fact: c.answer, why_question: 'Why is this important: ' + c.question + '?', connection_question: 'How does this connect to the rest of your notes?', model_answer: c.answer, chain: ['input', 'process', 'output'], chain_caption: 'Basic chain', primer: c.answer, primer_terms: [] }));
    if (!items || !items.length) { this.setSession('elaborative_interrogation', { phase: 'genError' }); return; }
    this.setSession('elaborative_interrogation', { phase: 'learn', items, idx: 0, phaseLearn: true, whyText: '', connText: '', result: null, flags: {}, phaseActive: false, phaseWhy: false, phaseConnect: false, phaseGrading: false, phaseReview: false, phaseSummary: false });
  };

  eiStartQuestion = () => this.setSession('elaborative_interrogation', { phaseLearn: false, phaseActive: true, phaseWhy: true });
  eiSetWhyText = (e: any) => this.setSession('elaborative_interrogation', { whyText: e.target.value });
  eiSetConnText = (e: any) => this.setSession('elaborative_interrogation', { connText: e.target.value });

  eiSubmitWhy = async () => {
    const sess = this.state.session.elaborative_interrogation;
    const items = sess.items || []; const it = items[sess.idx];
    if (!it || (sess.whyText || '').trim().length < 5) return;
    this.setSession('elaborative_interrogation', { phaseGrading: true });
    const prompt = `Fact: "${it.fact}"\nWhy question: "${it.why_question}"\nModel answer: "${it.model_answer}"\nStudent answer: "${sess.whyText}"\n\nReturn ONLY JSON: {"verdict": "correct"|"partial"|"incorrect", "feedback": "one sentence", "model_answer": "restate model answer"}`;
    const p = this.parseJson(await this.callAI(prompt, 'You evaluate why-question answers. Respond with ONLY valid JSON.'));
    let result = p && typeof p.verdict === 'string' ? { verdict: p.verdict, feedback: String(p.feedback || ''), model_answer: String(p.model_answer || it.model_answer) } : null;
    if (!result && this.offlineMode()) result = { verdict: (sess.whyText || '').length > 20 ? 'partial' : 'incorrect', feedback: 'Compare your answer to the model.', model_answer: it.model_answer };
    if (!result) { this.setSession('elaborative_interrogation', { phaseGrading: false, phaseWhy: true }); return; }
    const flags = Object.assign({}, sess.flags); flags[sess.idx] = result.verdict === 'incorrect';
    this.setSession('elaborative_interrogation', { phaseGrading: false, phaseReview: true, result, flags });
    if (result.verdict !== 'correct') this.recordMissed([{ question: it.why_question, answer: it.model_answer }], 'elaborative_interrogation');
    this.addXp(6);
  };

  eiGotIt = () => {
    const sess = this.state.session.elaborative_interrogation;
    const items = sess.items || [];
    if (sess.idx + 1 >= items.length) { this.setSession('elaborative_interrogation', { phaseSummary: true, phaseLearn: false, phaseActive: false, phaseWhy: false, phaseReview: false }); this.markStudiedToday(); }
    else this.setSession('elaborative_interrogation', { idx: sess.idx + 1, phaseLearn: true, phaseActive: false, phaseWhy: false, phaseReview: false, whyText: '', connText: '', result: null });
  };
  eiRestart = () => this.setSession('elaborative_interrogation', { phase: 'gen' });

  // ---- Concrete examples ----
  generateConcreteExamples = async () => {
    this.setSession('concrete_examples', { phase: 'gen' });
    const prompt = `Study notes:\n\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nFor each abstract concept, generate a concrete real-world example. Return ONLY a JSON array (5-10 items) where each has: "concept", "plain_definition", "example", "sample_problem" (math only, else ""), "connection_question".`;
    const p = this.parseJson(await this.callAI(prompt, 'You create real-world examples for study concepts. Respond with ONLY a valid JSON array.'));
    let items = Array.isArray(p) ? p.filter((x: any) => x && x.concept && x.plain_definition && x.example && x.connection_question).map((x: any) => ({ concept: x.concept, plain_definition: x.plain_definition, example: x.example, sample_problem: typeof x.sample_problem === 'string' ? x.sample_problem : '', connection_question: x.connection_question })).slice(0, 10) : null;
    if ((!items || !items.length) && this.offlineMode()) items = (this.state.concepts || []).slice(0, 6).map((c: any) => ({ concept: c.question, plain_definition: c.answer, example: 'Think of a moment in daily life where this shows up.', sample_problem: '', connection_question: 'How does that example connect back to ' + c.question + '?' }));
    if (!items || !items.length) { this.setSession('concrete_examples', { phase: 'genError' }); return; }
    this.setSession('concrete_examples', { phase: 'card', items, idx: 0, revealed: false, text: '', result: null, flags: {}, reinforces: {}, gradeError: false });
  };

  ceReveal = () => this.setSession('concrete_examples', { revealed: true });
  setCEText = (e: any) => this.setSession('concrete_examples', { text: e.target.value });
  ceGotIt = () => { const sess = this.state.session.concrete_examples; if (sess.idx + 1 >= (sess.items || []).length) this.setSession('concrete_examples', { phase: 'summary', result: null }); else this.setSession('concrete_examples', { idx: sess.idx + 1, phase: 'card', revealed: false, text: '', result: null, gradeError: false }); };
  ceRestart = () => this.setSession('concrete_examples', { phase: 'card', idx: 0, revealed: false, text: '', result: null, flags: {}, reinforces: {}, gradeError: false });

  submitCE = async () => {
    const sess = this.state.session.concrete_examples;
    const item = (sess.items || [])[sess.idx]; if (!item || (sess.text || '').trim().length <= 5) return;
    this.setSession('concrete_examples', { phase: 'grading', gradeError: false });
    const prompt = `Concept: "${item.concept}". Definition: "${item.plain_definition}". Example: "${item.example}".\nStudent explanation of connection: "${sess.text}"\nReturn ONLY JSON: {"correct": true/false, "got_right": "one sentence", "missed": "one sentence or ''", "reinforce": "one sentence"}`;
    const p = this.parseJson(await this.callAI(prompt, 'You check concept-example connections. Respond with ONLY valid JSON.'));
    let result: any = p && typeof p.correct === 'boolean' ? { correct: p.correct, got_right: String(p.got_right || ''), missed: String(p.missed || ''), reinforce: String(p.reinforce || '') } : null;
    if (!result && this.offlineMode()) result = { correct: (sess.text || '').trim().length > 20, got_right: 'You connected the example.', missed: '', reinforce: item.plain_definition };
    if (!result) { this.setSession('concrete_examples', { phase: 'card', gradeError: true }); return; }
    const flags = Object.assign({}, sess.flags); if (flags[sess.idx] == null) flags[sess.idx] = result.correct;
    const reinforces = Object.assign({}, sess.reinforces); reinforces[sess.idx] = result.reinforce;
    this.setSession('concrete_examples', { phase: 'feedback', result, flags, reinforces });
    if (!result.correct) this.recordMissed([{ question: item.concept, answer: item.plain_definition + ' Example: ' + item.example }], 'examples');
    this.addXp(6); this.markStudiedToday();
  };

  // ---- Practice testing ----
  generatePracticeTest = async () => {
    this.setSession('practice_testing', { phase: 'gen' });
    const prompt = `Study notes:\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nGenerate 10 mixed practice test questions (multiple choice, true/false, short answer).\nReturn ONLY a JSON array where each has: "question", "type" ("multiple_choice"|"true_or_false"|"short_answer"), "options" (4 strings for MC only), "correct_answer".`;
    const raw = await this.callAI(prompt, 'You write practice tests. Respond with ONLY a valid JSON array.');
    let qs: any[] | null = null;
    if (raw) { try { const p = JSON.parse(raw.replace(/```json|```/g, '').trim()); if (Array.isArray(p)) { qs = p.filter((q: any) => q && typeof q.question === 'string' && q.correct_answer != null && (q.type === 'true_or_false' || q.type === 'short_answer' || (q.type === 'multiple_choice' && Array.isArray(q.options) && q.options.length === 4))).slice(0, 10); if (qs.length < 3) qs = null; } } catch {} }
    if (!qs && this.offlineMode()) qs = mod.buildMCQ(this.state.concepts || []).slice(0, 8).map((q: any) => ({ question: q.question, type: 'multiple_choice', options: q.options.map(String), correct_answer: 'A' }));
    if (!qs || !qs.length) { this.setSession('practice_testing', { phase: 'genError' }); return; }
    const questions = qs.map((q: any) => ({ ...q, options: q.options ? q.options.map((o: string) => String(o).replace(/^\s*[A-Da-d][.)]\s+/, '').trim()) : undefined }));
    const TIMER = 60;
    this.setSession('practice_testing', { phase: 'ready', questions, answers: new Array(questions.length).fill(null), current: 0, saText: '', timeLeft: TIMER, results: null, grading: false });
  };

  ptStart = () => {
    const sess = this.state.session.practice_testing;
    this.setSession('practice_testing', { phase: 'test', timeLeft: 60 });
    if (this.ptTimer) clearInterval(this.ptTimer);
    this.ptTimer = setInterval(() => {
      const s = this.state.session.practice_testing;
      if (!s || s.phase !== 'test') { clearInterval(this.ptTimer); this.ptTimer = null; return; }
      if (s.timeLeft <= 0) { clearInterval(this.ptTimer); this.ptTimer = null; this.ptTimeOut(); return; }
      this.setSession('practice_testing', { timeLeft: s.timeLeft - 1 });
    }, 1000);
  };

  ptTimeOut = () => { const sess = this.state.session.practice_testing; const answers = (sess.answers || []).slice(); this.ptGrade(sess.questions, answers, true); };

  ptPickMC = (optIdx: number) => {
    const sess = this.state.session.practice_testing;
    const letters = ['A', 'B', 'C', 'D']; const ans = letters[optIdx] || 'A';
    const answers = (sess.answers || []).slice(); answers[sess.current] = ans;
    const next = sess.current + 1;
    if (next >= (sess.questions || []).length) { if (this.ptTimer) { clearInterval(this.ptTimer); this.ptTimer = null; } this.ptGrade(sess.questions, answers, false); }
    else this.setSession('practice_testing', { answers, current: next, saText: '', timeLeft: 60 });
  };
  ptPickTF = (val: string) => {
    const sess = this.state.session.practice_testing;
    const answers = (sess.answers || []).slice(); answers[sess.current] = val;
    const next = sess.current + 1;
    if (next >= (sess.questions || []).length) { if (this.ptTimer) { clearInterval(this.ptTimer); this.ptTimer = null; } this.ptGrade(sess.questions, answers, false); }
    else this.setSession('practice_testing', { answers, current: next, saText: '', timeLeft: 60 });
  };
  ptSetSaText = (e: any) => this.setSession('practice_testing', { saText: e.target.value });
  ptSubmitSA = () => {
    const sess = this.state.session.practice_testing;
    if (!(sess.saText || '').trim()) return;
    const answers = (sess.answers || []).slice(); answers[sess.current] = sess.saText;
    const next = sess.current + 1;
    if (next >= (sess.questions || []).length) { if (this.ptTimer) { clearInterval(this.ptTimer); this.ptTimer = null; } this.ptGrade(sess.questions, answers, false); }
    else this.setSession('practice_testing', { answers, current: next, saText: '', timeLeft: 60 });
  };

  async ptGrade(questions: any[], answers: any[], timedOut: boolean) {
    this.setSession('practice_testing', { phase: 'grading', grading: true });
    const letters = ['A', 'B', 'C', 'D'];
    const results = questions.map((q: any, i: number) => {
      const userAns = answers[i] == null ? '(unanswered)' : String(answers[i]);
      let correct = false; let correctDisplay = String(q.correct_answer || '');
      if (q.type === 'multiple_choice') {
        const cIdx = letters.indexOf(q.correct_answer); const cText = q.options?.[cIdx] || q.correct_answer;
        correctDisplay = q.correct_answer + '. ' + cText;
        correct = userAns === q.correct_answer;
      } else if (q.type === 'true_or_false') {
        correct = userAns.toLowerCase() === (q.correct_answer || '').toLowerCase();
      }
      return { question: q.question, type: q.type, yours: userAns, correctDisplay, correct, explanation: '' };
    });
    const saIdxs = results.map((r: any, i: number) => ({ r, i })).filter((x: any) => x.r.type === 'short_answer');
    if (saIdxs.length && !this.offlineMode()) {
      const prompt = `Grade these short answers:\n${JSON.stringify(saIdxs.map((x: any) => ({ i: x.i, question: x.r.question, model_answer: x.r.correctDisplay, student_response: x.r.yours })))}\nReturn ONLY a JSON array of {"i": idx, "verdict": "correct"|"partially_correct"|"incorrect", "explanation": "one sentence"}`;
      const raw = await this.callAI(prompt, 'You grade short-answer responses. Respond with ONLY a valid JSON array.');
      if (raw) { try { const p = JSON.parse(raw.replace(/```json|```/g, '').trim()); if (Array.isArray(p)) p.forEach((x: any) => { if (results[x.i]) { results[x.i].correct = x.verdict === 'correct'; results[x.i].explanation = x.explanation || ''; } }); } catch {} }
    } else { saIdxs.forEach((x: any) => { results[x.i].correct = (x.r.yours || '').trim().length > 5; }); }
    const score = results.filter((r: any) => r.correct).length;
    const wrong = results.filter((r: any) => !r.correct);
    this.recordMissed(wrong.map((r: any) => ({ question: r.question, answer: r.correctDisplay })), 'practice_testing');
    this.addXp(Math.round(score * 3)); this.markStudiedToday();
    const ptHistory = (this.state.ptHistory || []).concat({ score, total: results.length, date: this.dayKey(Date.now()) }).slice(-20);
    this.update({ ptHistory });
    this.setSession('practice_testing', { phase: 'results', results, score, timedOut, grading: false });
  }

  ptRetry = () => this.generatePracticeTest();

  // ---- Self explanation ----
  initSelfExplanation() {
    const chunks = (this.state.material || '').replace(/\r/g, '\n').split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 20);
    this.setSession('self_explanation', { phase: 'read', chunks, idx: 0, text: '', result: null, firstTry: {}, struggled: {} });
  }
  seSetText = (e: any) => this.setSession('self_explanation', { text: e.target.value });
  seSubmit = async () => {
    const sess = this.state.session.self_explanation;
    const chunks = sess.chunks || []; const chunk = chunks[sess.idx]; if (!chunk || (sess.text || '').trim().length < 5) return;
    this.setSession('self_explanation', { phase: 'evaluating' });
    const prompt = `Student's note line:\n"""${chunk}"""\n\nStudent's explanation:\n"""${sess.text}"""\n\nReturn ONLY JSON: {"correct": true/false, "feedback": "one sentence", "simpler": "simpler restatement"}`;
    const p = this.parseJson(await this.callAI(prompt, 'You evaluate self-explanations. Respond with ONLY valid JSON.'));
    let result: any = p && typeof p.correct === 'boolean' ? { correct: p.correct, feedback: String(p.feedback || ''), simpler: String(p.simpler || '') } : null;
    if (!result && this.offlineMode()) result = { correct: (sess.text || '').trim().length > 15, feedback: 'Compare your explanation to the original.', simpler: chunk };
    if (!result) { this.setSession('self_explanation', { phase: 'read' }); return; }
    const firstTry = Object.assign({}, sess.firstTry); if (firstTry[sess.idx] == null) firstTry[sess.idx] = result.correct;
    const struggled = Object.assign({}, sess.struggled);
    if (!result.correct) struggled[sess.idx] = { keyIdea: chunk.slice(0, 60), chunk, simpler: result.simpler };
    this.setSession('self_explanation', { phase: 'feedback', result, firstTry, struggled });
    this.addXp(4);
  };
  seGotIt = () => {
    const sess = this.state.session.self_explanation;
    const chunks = sess.chunks || [];
    if (sess.idx + 1 >= chunks.length) { this.setSession('self_explanation', { phase: 'summary' }); this.markStudiedToday(); }
    else this.setSession('self_explanation', { idx: sess.idx + 1, phase: 'read', text: '', result: null });
  };
  seExplainAgain = () => this.setSession('self_explanation', { phase: 'read', text: '' });
  seRestart = () => this.initSelfExplanation();
  seToFlashcards = () => {
    const sess = this.state.session.self_explanation;
    const keys = Object.keys(sess.struggled || {});
    if (!keys.length) return;
    const cards = keys.map((k: string) => ({ question: 'Explain in your own words: ' + sess.struggled[k].keyIdea, answer: sess.struggled[k].simpler, methodTag: 'active_recall' }));
    this.sendCardsToActiveRecall(cards);
  };

  // ---- Problem sets ----
  generateProblemSets = async () => {
    this.setSession('problem_sets', { phase: 'gen' });
    const prompt = `Study notes:\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nIdentify the distinct problem types/skills in these math/science notes. For each skill, provide a worked example (with steps and why for each) and 2 practice problems.\nReturn ONLY a JSON array where each has: "skill", "worked": {"problem", "steps": [{"step", "why"}]}, "practice": [{"problem", "answer", "hint"}]`;
    const p = this.parseJson(await this.callAI(prompt, 'You create problem sets from study notes. Respond with ONLY a valid JSON array.'));
    let skills = Array.isArray(p) ? p.filter((x: any) => x && x.skill && x.worked && Array.isArray(x.practice)).slice(0, 6) : null;
    if ((!skills || !skills.length) && this.offlineMode()) { this.setSession('problem_sets', { phase: 'genError', genErrorText: 'No AI available. Try pasting math notes.' }); return; }
    if (!skills || !skills.length) { this.setSession('problem_sets', { phase: 'genError', genErrorText: 'Could not generate problems from these notes.' }); return; }
    this.setSession('problem_sets', { phase: 'pick', skills, skillIdx: 0, pIdx: 0, stepsShown: 1, work: '', result: null, solved: {}, errorTypes: {}, gradeError: false });
  };

  psPickSkill = (idx: number) => this.setSession('problem_sets', { skillIdx: idx, phase: 'worked', stepsShown: 1 });
  psRevealStep = () => { const sess = this.state.session.problem_sets; this.setSession('problem_sets', { stepsShown: Math.min((sess.stepsShown || 1) + 1, (sess.skills[sess.skillIdx].worked.steps || []).length) }); };
  psStartPractice = () => this.setSession('problem_sets', { phase: 'solve', pIdx: 0, work: '', result: null });
  psSetWork = (v: string) => this.setSession('problem_sets', { work: v });
  psSymbol = (ch: string) => { const sess = this.state.session.problem_sets; this.setSession('problem_sets', { work: (sess.work || '') + ch }); };
  psStuck = () => { const sess = this.state.session.problem_sets; const sk = sess.skills[sess.skillIdx]; const prac = sk.practice[sess.pIdx]; this.setSession('problem_sets', { showHint: true, hint: prac.hint || 'Check the worked example again.' }); };

  psSubmit = async () => {
    const sess = this.state.session.problem_sets;
    const sk = sess.skills[sess.skillIdx]; const prac = sk.practice[sess.pIdx];
    if (!(sess.work || '').trim()) return;
    this.setSession('problem_sets', { phase: 'grading', gradeError: false });
    const prompt = `Student's solution (one step per line):\n"""${sess.work}"""\n\nCorrect answer: "${prac.answer}"\nWorked example steps: ${JSON.stringify((sk.worked.steps || []).map((s: any) => s.step))}\n\nGrade each line. Return ONLY JSON: {"lines": ["line text"...], "errLine": null or line number (1-based), "errorType": "sign error"|"algebra"|"skipped step"|null, "explanation": "one sentence about the error or null", "correctLine": "correct version of the error line or null"}`;
    const p = this.parseJson(await this.callAI(prompt, 'You grade math work line by line. Respond with ONLY valid JSON.'));
    let result: any = p && Array.isArray(p.lines) ? { lines: p.lines, errLine: p.errLine ?? null, errorType: p.errorType || null, explanation: p.explanation || '', correctLine: p.correctLine || '' } : null;
    if (!result && this.offlineMode()) result = { lines: (sess.work || '').split('\n').filter((l: string) => l.trim()), errLine: null, errorType: null, explanation: '', correctLine: '' };
    if (!result) { this.setSession('problem_sets', { phase: 'solve', gradeError: true }); return; }
    const solvedKey = sess.skillIdx + ':' + sess.pIdx;
    const solved = Object.assign({}, sess.solved); solved[solvedKey] = result.errLine == null ? (sess.pIdx === 0 ? 'first' : 'yes') : 'incorrect';
    const errorTypes = Object.assign({}, sess.errorTypes); if (result.errorType) errorTypes[result.errorType] = (errorTypes[result.errorType] || 0) + 1;
    if (result.errLine == null) this.addXp(8);
    this.markStudiedToday();
    this.setSession('problem_sets', { phase: 'marked', result, solved, errorTypes });
  };

  psFixIt = () => { const sess = this.state.session.problem_sets; this.setSession('problem_sets', { phase: 'solve', work: '', result: null }); };
  psNextProblem = () => {
    const sess = this.state.session.problem_sets;
    const sk = sess.skills[sess.skillIdx];
    if (sess.pIdx + 1 >= (sk.practice || []).length) { this.setSession('problem_sets', { phase: 'summary' }); }
    else this.setSession('problem_sets', { pIdx: sess.pIdx + 1, phase: 'solve', work: '', result: null, showHint: false });
  };
  psBackToSkills = () => this.setSession('problem_sets', { phase: 'pick' });
  psToSummary = () => this.setSession('problem_sets', { phase: 'summary' });

  // ---- Feynman ----
  generateFeynman = async () => {
    this.setSession('feynman', { phase: 'gen' });
    const prompt = `Study notes:\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nPick 5-8 key concepts. Return ONLY a JSON array where each has: "concept", "question" (teach this like explaining to a 10-year-old).`;
    const p = this.parseJson(await this.callAI(prompt, 'You pick key concepts for the Feynman technique. Respond with ONLY a valid JSON array.'));
    let items = Array.isArray(p) ? p.filter((x: any) => x && x.concept && x.question).slice(0, 8) : null;
    if ((!items || !items.length) && this.offlineMode()) items = (this.state.concepts || []).slice(0, 6).map((c: any) => ({ concept: c.question, question: c.question }));
    if (!items || !items.length) { this.setSession('feynman', { phase: 'genError' }); return; }
    this.setSession('feynman', { phase: 'explain', items, idx: 0, text: '', result: null, scores: {} });
  };

  feynSetText = (e: any) => this.setSession('feynman', { text: e.target.value });

  feynSubmit = async () => {
    const sess = this.state.session.feynman;
    const item = (sess.items || [])[sess.idx]; if (!item || (sess.text || '').trim().length < 10) return;
    this.setSession('feynman', { phase: 'grading' });
    const prompt = `Concept: "${item.concept}"\nStudent's simple explanation:\n"""${sess.text}"""\n\nScore 1-5 and give feedback.\nReturn ONLY JSON: {"score": 1-5, "feedback": "brief feedback", "model": "ideal simple explanation"}`;
    const p = this.parseJson(await this.callAI(prompt, 'You evaluate Feynman explanations. Respond with ONLY valid JSON.'));
    let result: any = p && typeof p.score === 'number' ? { score: p.score, feedback: String(p.feedback || ''), model: String(p.model || '') } : null;
    if (!result && this.offlineMode()) result = { score: (sess.text || '').trim().length > 50 ? 3 : 2, feedback: 'Compare to the model explanation.', model: item.concept };
    if (!result) { this.setSession('feynman', { phase: 'explain' }); return; }
    const scores = Object.assign({}, sess.scores); scores[sess.idx] = result.score;
    if (result.score < 3) this.recordMissed([{ question: item.concept, answer: result.model }], 'feynman');
    this.addXp(result.score); this.markStudiedToday();
    this.setSession('feynman', { phase: 'feedback', result, scores });
  };

  feynNext = () => {
    const sess = this.state.session.feynman;
    if (sess.idx + 1 >= (sess.items || []).length) { this.setSession('feynman', { phase: 'summary' }); }
    else this.setSession('feynman', { idx: sess.idx + 1, phase: 'explain', text: '', result: null });
  };
  feynRestart = () => this.setSession('feynman', { phase: 'explain', idx: 0, text: '', result: null, scores: {} });
  feynToFlashcards = () => {
    const sess = this.state.session.feynman;
    const items = sess.items || []; const scores = sess.scores || {};
    const weak = items.filter((_: any, i: number) => (scores[i] || 0) < 3);
    if (!weak.length) return;
    this.sendCardsToActiveRecall(weak.map((it: any) => ({ question: 'Explain simply: ' + it.concept, answer: it.concept, methodTag: 'active_recall' })));
  };

  // ---- Chunking ----
  generateChunking = async () => {
    this.setSession('chunking', { phase: 'gen' });
    const prompt = `Study notes:\n"""${(this.state.material || '').slice(0, 6000)}"""\n\nBreak into 6-10 bite-size focus chunks. Return ONLY a JSON array where each has: "title", "content", "tip" (one study tip for this chunk).`;
    const p = this.parseJson(await this.callAI(prompt, 'You break study notes into chunks. Respond with ONLY a valid JSON array.'));
    let chunks = Array.isArray(p) ? p.filter((x: any) => x && x.title && x.content).slice(0, 10) : null;
    if ((!chunks || !chunks.length) && this.offlineMode()) { const lines = (this.state.material || '').split('\n').filter((l: string) => l.trim().length > 20).slice(0, 8); chunks = lines.map((l: string, i: number) => ({ title: 'Chunk ' + (i + 1), content: l, tip: 'Read it carefully.' })); }
    if (!chunks || !chunks.length) { this.setSession('chunking', { phase: 'genError' }); return; }
    this.setSession('chunking', { phase: 'study', chunks, idx: 0, done: {} });
  };

  chunkNext = () => {
    const sess = this.state.session.chunking;
    const done = Object.assign({}, sess.done); done[sess.idx] = true;
    const nextIdx = sess.idx + 1;
    if (nextIdx >= (sess.chunks || []).length) { this.setSession('chunking', { idx: nextIdx - 1, done, phase: 'summary' }); this.addXp(6); this.markStudiedToday(); }
    else this.setSession('chunking', { idx: nextIdx, done });
  };
  chunkRestart = () => this.setSession('chunking', { phase: 'study', idx: 0, done: {} });

  // ---- Calendar / badges ----
  setCalendarMode = (mode: string) => this.setState({ calendarMode: mode });
  calMonthPrev = () => this.setState({ calMonthOffset: this.state.calMonthOffset - 1 });
  calMonthNext = () => this.setState({ calMonthOffset: this.state.calMonthOffset + 1 });
  calendarToggle = (dateKey: string) => {
    if (this.state.calendarMode === 'test') {
      this.update({ testDate: this.state.testDate === dateKey ? null : dateKey });
    } else {
      const has = this.state.studiedDates.includes(dateKey);
      const dates = has ? this.state.studiedDates.filter((d: string) => d !== dateKey) : this.state.studiedDates.concat(dateKey);
      this.update({ studiedDates: dates });
    }
  };

  // ---- Library ----
  saveToLibrary(parsed: any) {
    const id = 'm' + Date.now();
    const entry = { id, name: parsed.topic || 'Untitled notes', material: this.state.material, concepts: parsed.cards, topic: parsed.topic, isMath: !!(parsed.is_math || parsed.isMath), savedAt: Date.now() };
    const library = (this.state.library || []).filter((x: any) => x.material !== entry.material).concat(entry).slice(-12);
    this.update({ library, currentMaterialId: id });
  }

  switchMaterial = (id: string) => {
    const entry = (this.state.library || []).find((x: any) => x.id === id);
    if (!entry || id === this.state.currentMaterialId) return;
    this.update({ material: entry.material, concepts: entry.concepts, topic: entry.topic, isMath: !!entry.isMath, currentMaterialId: id, session: {}, tab: 'today', activeMethod: null, screen: 'app' });
    if (entry.isMath) setTimeout(() => this.setState({ mathNoticeOpen: true }), 0);
  };

  startRename = (id: string) => { const e = (this.state.library || []).find((x: any) => x.id === id); this.setState({ renamingId: id, renameDraft: e ? e.name : '' }); };
  onRenameInput = (e: any) => this.setState({ renameDraft: e.target.value });
  cancelRename = () => this.setState({ renamingId: null, renameDraft: '' });
  saveRename = () => {
    const n = (this.state.renameDraft || '').trim(); if (!n) return;
    const library = (this.state.library || []).map((x: any) => x.id === this.state.renamingId ? Object.assign({}, x, { name: n }) : x);
    const patch: any = { library }; if (this.state.renamingId === this.state.currentMaterialId) patch.topic = n;
    this.update(patch); this.setState({ renamingId: null, renameDraft: '' });
  };

  closeMathNotice = () => this.setState({ mathNoticeOpen: false });
  acceptMathMethods = () => { const ranked = mod.MATH_METHODS.slice(); this.update({ topMethods: ranked.slice(0, 3), activeMethod: null, mathNoticeOpen: false, session: {} }); };
  goEditMaterial = () => this.setState({ materialDraft: '', materialMode: 'paste', screen: 'material', fromApp: true });

  saveAskedAge = () => {
    const a = parseInt(this.state.ageDraft, 10);
    if (a >= 5 && a <= 99) this.update({ age: a, askAge: false });
  };

  setAccountDraft = (e: any) => this.setState({ accountDraft: e.target.value });
  saveAccount = () => { if (!(this.state.accountDraft || '').trim()) return; this.update({ account: this.state.accountDraft.trim(), showAccount: false }); };
  skipAccount = () => this.setState({ showAccount: false });

  // ---- renderVals ----
  renderVals() {
    const s = this.state;
    const pomodoroFocusMinutes = POMODORO_FOCUS;
    const mascotName = MASCOT;

    const tutorialSlides = [
      { title: 'PASTE YOUR NOTES', body: `Drop in your notes, a chapter, or a PDF. ${mascotName}'s AI turns it into study material, no retyping.` },
      { title: 'TAKE THE QUIZ', body: `7 quick questions about how you study. ${mascotName} finds the method that fits YOUR brain, not a generic one.` },
      { title: 'STUDY & LEVEL UP', body: `Study with your method, earn XP, keep your streak alive, and try other methods anytime.` },
    ];
    const t = tutorialSlides[s.tutorialIdx] || tutorialSlides[0];

    const subjectOptions = mod.SUBJECTS.map((sub: any) => ({ label: sub.label, pick: () => this.pickSubject(sub.id) }));
    const q = mod.QUIZ_QUESTIONS[s.quizIdx];
    const quizRaw = q ? s.quizAnswers[s.quizIdx] : null;
    const quizPicked = quizRaw == null ? [] : Array.isArray(quizRaw) ? quizRaw : [quizRaw];
    const quizTied = quizPicked.length > 1;
    const quizOptions = q ? q.options.map((o: any, i: number) => {
      const sel = quizPicked.includes(i);
      return { label: o.text, pick: () => this.pickQuizOption(i), bg: sel ? '#7C5CFC' : '#fff', color: sel ? '#fff' : '#201E2E', shadow: sel ? '3px 3px 0 #201E2E' : 'none', badgeShown: sel, weightBadge: quizTied ? 'HALF' : 'PICKED' };
    }) : [];
    const quizAnswered = quizPicked.length > 0;
    const quizTieHint = quizTied ? 'Both of these count half. Tap either one again to drop it.' : quizAnswered ? 'Stuck between two? Tap a second one and they each count half.' : 'Pick the closest one. You can tap two if you are torn.';
    const quizTieColor = quizTied ? '#7C5CFC' : '#8a8194';

    const mtInfo = mod.METHODS.find((m: any) => m.id === s.pendingMethod);
    const rankColors: any = { 0: '#FF6B4A', 1: '#7C5CFC', 2: '#2DD4A7' };
    const rankLabels: any = { 0: '🥇', 1: '🥈', 2: '🥉' };
    const resultCards = s.topMethods.length ? s.topMethods.map((id: string, i: number) => {
      const info = mod.METHODS.find((m: any) => m.id === id) || { label: id, whyWorks: '', evidence: '' };
      return { label: info.label, whyWorks: info.whyWorks, evidence: info.evidence, color: rankColors[i], rankLabel: rankLabels[i] };
    }) : [];

    // Method chips for top nav
    const allMethods = mod.METHODS;
    const methodChips = allMethods.map((m: any) => ({
      id: m.id, label: m.label,
      pick: () => this.switchMethod(m.id),
      bg: s.activeMethod === m.id ? '#201E2E' : '#fff',
      color: s.activeMethod === m.id ? '#fff' : '#201E2E',
      badge: !!s.methodsTried[m.id],
      isTopPick: s.topMethods[0] === m.id,
    }));

    // Today tab
    const now = Date.now();
    const todayKey = this.dayKey(now);
    const nextStepMethod = s.topMethods[0] ? mod.METHODS.find((m: any) => m.id === s.topMethods[0]) : null;
    const dueItems = (s.missedBank || []).filter((b: any) => b.dueAt <= now);
    const hasMissed = dueItems.length > 0;
    const planSteps = nextStepMethod ? nextStepMethod.appSteps.map((text: string, i: number) => ({ n: String(i + 1) + '.', text })) : [];
    const methodBadges = allMethods.map((m: any) => ({
      id: m.id, label: m.label,
      tried: !!s.methodsTried[m.id],
      isTopPick: s.topMethods[0] === m.id,
      pick: () => this.pickMethod(m.id),
      bg: s.topMethods[0] === m.id ? '#FF6B4A' : s.methodsTried[m.id] ? '#201E2E' : '#fff',
      color: s.topMethods[0] === m.id || s.methodsTried[m.id] ? '#fff' : '#201E2E',
    }));

    const badgeList = [
      { id: 'first_session', label: '🎯 First Session', unlocked: s.sessionsFinished >= 1 },
      { id: 'streak_3', label: '🔥 3-day streak', unlocked: (s.streak || 0) >= 3 },
      { id: 'streak_7', label: '🔥 Week streak', unlocked: (s.streak || 0) >= 7 },
      { id: 'xp_50', label: '⭐ 50 XP', unlocked: (s.xp || 0) >= 50 },
      { id: 'xp_200', label: '⭐ 200 XP', unlocked: (s.xp || 0) >= 200 },
      { id: 'all_methods', label: '🏆 All methods tried', unlocked: allMethods.every((m: any) => s.methodsTried[m.id]) },
    ];

    // Calendar
    const calDate = new Date(); calDate.setDate(1); calDate.setMonth(calDate.getMonth() + s.calMonthOffset);
    const monthLabel = calDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
    const firstDow = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
    const cells: any[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ label: '', key: '', empty: true, isStudied: false, isTest: false, isToday: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = calDate.getFullYear() + '-' + (calDate.getMonth() + 1) + '-' + d;
      const isToday = key === todayKey;
      const isStudied = s.studiedDates.includes(key);
      const isTest = s.testDate === key;
      cells.push({ label: String(d), key, empty: false, isStudied, isTest, isToday, pick: () => this.calendarToggle(key) });
    }

    // Study method UIs
    const arSess = s.session.active_recall;
    const arCards = (arSess && arSess.customCards) ? arSess.customCards : mod.buildFlashcards(s.concepts || []);
    let arUI: any;
    if (!arSess || arSess.finished) {
      arUI = { finished: true, counts: arSess?.counts || {}, restart: this.arRestart, cardFront: '', cardBack: '', flipped: false, flipCard: () => {}, rateEasy: () => {}, rateMedium: () => {}, rateHard: () => {}, remaining: 0, total: arCards.length };
    } else {
      const queueIdx = (arSess.queue || [])[0];
      const card = arCards[queueIdx] || arCards[0] || { question: '—', answer: '—' };
      arUI = {
        finished: false, flipped: !!arSess.flipped, cardFront: card.question, cardBack: card.answer,
        flipCard: this.arFlip, rateEasy: () => this.arRate('easy'), rateMedium: () => this.arRate('medium'), rateHard: () => this.arRate('hard'),
        counts: arSess.counts || {}, remaining: (arSess.queue || []).length, total: arCards.length,
        restart: this.arRestart,
      };
    }

    // Blurting
    const blurtSess = s.session.blurting;
    const escRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const segGreen = { background: '#C9F5E5', borderBottom: '2px solid #2DD4A7', fontWeight: 800 };
    const segRed = { background: '#FFD9DA', borderBottom: '2px solid #FF5A5F', fontWeight: 800 };
    const segmentize = (text: string, covered: string[], missed: string[]) => {
      if (!text) return [];
      const terms = covered.map((t: string) => ({ t, style: segGreen })).concat(missed.map((t: string) => ({ t, style: segRed }))).filter((x: any) => x.t && x.t.trim().length > 1).sort((a: any, b: any) => b.t.length - a.t.length);
      if (!terms.length) return [{ text, style: {} }];
      let pieces: string[];
      try { pieces = text.split(new RegExp('(' + terms.map((x: any) => escRe(x.t)).join('|') + ')', 'gi')); } catch { return [{ text, style: {} }]; }
      return pieces.filter((p: string) => p !== '').map((p: string) => { const m = terms.find((x: any) => x.t.toLowerCase() === p.toLowerCase()); return { text: p, style: m ? m.style : {} }; });
    };
    let blurtingUI: any;
    if (!blurtSess || !blurtSess.phase) {
      blurtingUI = { phaseTopics: true, phaseTopicsError: false, phaseWrite: false, phaseGrading: false, phaseCompare: false, phaseSummary: false, topicName: '', topicNum: 0, topicCount: 0, timerLabel: '0:00', text: '', setText: (e: any) => this.setBlurtText(e.target.value), cantSubmit: true, submit: this.submitBlurt, gradeError: false, blurtSegments: [], noteSegments: [], scoreLine: '', hasPrev: false, prevLine: '', tryAgain: this.tryTopicAgain, nextTopic: this.nextBlurtTopic, nextLabel: 'NEXT TOPIC →', retryTopics: this.extractBlurtTopics, summaryRows: [], overall: 0, restart: this.restartBlurting };
    } else {
      const bTopics = blurtSess.topics || []; const bCur = bTopics[blurtSess.idx] || { topic: '' };
      const bRes = blurtSess.result; const bScore = blurtSess.scores ? blurtSess.scores[blurtSess.idx] : null;
      const bEl = blurtSess.elapsed || 0;
      const bPcts = bTopics.map((t: any, i: number) => { const s2 = blurtSess.scores && blurtSess.scores[i]; return s2 ? Math.round(100 * s2.covered / Math.max(1, s2.total)) : 0; });
      blurtingUI = {
        phaseTopics: blurtSess.phase === 'topics', phaseTopicsError: blurtSess.phase === 'topicsError',
        phaseWrite: blurtSess.phase === 'write', phaseGrading: blurtSess.phase === 'grading',
        phaseCompare: blurtSess.phase === 'compare', phaseSummary: blurtSess.phase === 'summary',
        topicName: bCur.topic, topicNum: blurtSess.idx + 1, topicCount: bTopics.length,
        timerLabel: Math.floor(bEl / 60) + ':' + String(bEl % 60).padStart(2, '0'),
        text: blurtSess.text || '', setText: (e: any) => this.setBlurtText(e.target.value),
        cantSubmit: (blurtSess.text || '').trim().length <= 10, submit: this.submitBlurt, gradeError: !!blurtSess.gradeError,
        blurtSegments: bRes ? segmentize(blurtSess.text || '', bRes.covered, []) : [],
        noteSegments: bRes ? segmentize(bRes.notesSection || '', bRes.covered, bRes.missed) : [],
        scoreLine: bScore ? 'You covered ' + bScore.covered + ' out of ' + bScore.total + ' key points' : '',
        hasPrev: !!blurtSess.prevScore, prevLine: blurtSess.prevScore ? 'Last try: ' + blurtSess.prevScore.covered + '/' + blurtSess.prevScore.total : '',
        tryAgain: this.tryTopicAgain, nextTopic: this.nextBlurtTopic,
        nextLabel: blurtSess.idx >= bTopics.length - 1 ? 'FINISH → SUMMARY' : 'NEXT TOPIC →',
        retryTopics: this.extractBlurtTopics,
        summaryRows: bTopics.map((t: any, i: number) => { const weak = bPcts[i] < 50; const s2 = blurtSess.scores && blurtSess.scores[i]; return { topic: t.topic, label: s2 ? s2.covered + '/' + s2.total : '-', pct: bPcts[i] + '%', weak }; }),
        overall: bTopics.length ? Math.round(bPcts.reduce((a: number, b: number) => a + b, 0) / bTopics.length) : 0,
        restart: this.restartBlurting,
      };
    }

    // Pomodoro
    const pomSess = s.session.pomodoro;
    let pomodoroUI: any;
    if (!pomSess) {
      pomodoroUI = { phaseIdle: true, phaseStudy: false, phasePaused: false, phaseCheck: false, phaseBreak: false, phaseLongBreak: false, phaseBreaking: false, timerLabel: '25:00', pct: '100%', focusInput: '', setFocusInput: () => {}, start: this.startPomodoro, pause: this.pausePomodoro, resume: this.resumePomodoro, submitCheck: this.submitPomCheck, startBreak: this.startBreak, endBreak: this.endBreak, pomNum: 1 };
    } else {
      const limit = pomodoroFocusMinutes * 60;
      const el = pomSess.elapsed || 0;
      const remaining = Math.max(0, limit - el);
      const timerLabel = Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
      pomodoroUI = {
        phaseIdle: pomSess.phase === 'idle', phaseStudy: pomSess.phase === 'study', phasePaused: pomSess.phase === 'paused',
        phaseCheck: pomSess.phase === 'check', phaseBreak: pomSess.phase === 'break', phaseLongBreak: pomSess.phase === 'longBreak', phaseBreaking: pomSess.phase === 'breaking',
        timerLabel, pct: Math.round(100 * remaining / limit) + '%', pomNum: (pomSess.pomIdx || 0) + 1,
        focusInput: pomSess.focusInput || '', setFocusInput: this.setPomFocusInput,
        start: this.startPomodoro, pause: this.pausePomodoro, resume: this.resumePomodoro,
        submitCheck: this.submitPomCheck, startBreak: this.startBreak, endBreak: this.endBreak,
      };
    }

    // Practice testing
    const ptSess = s.session.practice_testing;
    let ptUI: any;
    if (!ptSess) {
      ptUI = { phaseGen: true, phaseGenError: false, phaseReady: false, phaseTest: false, phaseGrading: false, phaseResults: false, start: this.ptStart, retry: this.ptRetry, question: '', qNum: 0, total: 0, timerLabel: '1:00', timerColor: '#201E2E', progressPct: '100%', isMC: false, isTF: false, isSA: false, mcOptions: [], pickTrue: () => this.ptPickTF('True'), pickFalse: () => this.ptPickTF('False'), saText: '', setSaText: this.ptSetSaText, submitSA: this.ptSubmitSA, cantSubmitSA: true, saSubmitBg: '#c9c2b8', saSubmitBgCursor: 'default', score: 0, scorePct: '0%', timedOut: false, rightCount: 0, wrongCount: 0, rightRows: [], reviewRows: [], noneRight: true };
    } else {
      const qs = ptSess.questions || []; const cur = qs[ptSess.current] || {};
      const tl = ptSess.timeLeft != null ? ptSess.timeLeft : 60;
      const letters = ['A', 'B', 'C', 'D'];
      ptUI = {
        phaseGen: ptSess.phase === 'gen', phaseGenError: ptSess.phase === 'genError', phaseReady: ptSess.phase === 'ready',
        phaseTest: ptSess.phase === 'test', phaseGrading: ptSess.phase === 'grading', phaseResults: ptSess.phase === 'results',
        start: this.ptStart, retry: this.ptRetry,
        question: cur.question || '', qNum: (ptSess.current || 0) + 1, total: qs.length,
        timerLabel: Math.floor(tl / 60) + ':' + String(tl % 60).padStart(2, '0'),
        timerColor: tl <= 10 ? '#FF5A5F' : '#201E2E',
        progressPct: Math.round(100 * ((ptSess.current || 0) + 1) / Math.max(1, qs.length)) + '%',
        isMC: cur.type === 'multiple_choice', isTF: cur.type === 'true_or_false', isSA: cur.type === 'short_answer',
        mcOptions: (cur.options || []).map((o: string, i: number) => ({ label: letters[i], text: o, pick: () => this.ptPickMC(i) })),
        pickTrue: () => this.ptPickTF('True'), pickFalse: () => this.ptPickTF('False'),
        saText: ptSess.saText || '', setSaText: this.ptSetSaText, submitSA: this.ptSubmitSA,
        cantSubmitSA: !(ptSess.saText || '').trim(), saSubmitBg: (ptSess.saText || '').trim() ? '#FF6B4A' : '#c9c2b8', saSubmitBgCursor: (ptSess.saText || '').trim() ? 'pointer' : 'default',
        score: ptSess.score || 0, scorePct: ptSess.results ? Math.round(100 * (ptSess.score || 0) / Math.max(1, ptSess.results.length)) + '%' : '0%',
        timedOut: !!ptSess.timedOut, rightCount: ptSess.results ? ptSess.results.filter((r: any) => r.correct).length : 0,
        wrongCount: ptSess.results ? ptSess.results.filter((r: any) => !r.correct).length : 0,
        rightRows: ptSess.results ? ptSess.results.filter((r: any) => r.correct).map((r: any, i: number) => ({ qNum: i + 1, question: r.question, yours: r.yours, correct: r.correctDisplay })) : [],
        reviewRows: ptSess.results ? ptSess.results.filter((r: any) => !r.correct).map((r: any, i: number) => ({ qNum: i + 1, question: r.question, yours: r.yours, correct: r.correctDisplay, explanation: r.explanation || '', verdictLabel: r.type === 'short_answer' ? 'PARTIAL' : 'WRONG', verdictColor: '#c92c30' })) : [],
        noneRight: ptSess.results ? ptSess.results.filter((r: any) => r.correct).length === 0 : true,
      };
    }

    // Elaborative interrogation
    const eiSess = s.session.elaborative_interrogation;
    let elaborativeUI: any;
    if (!eiSess || eiSess.phase === 'gen' || eiSess.phase === 'genError') {
      elaborativeUI = { phaseLearn: false, phaseGen: true, phaseGenError: eiSess?.phase === 'genError', phaseActive: false, phaseWhy: false, phaseGrading: false, phaseReview: false, phaseSummary: false, retryGen: this.generateElaborativeItems, num: 0, total: 0, fact: '', whyQuestion: '', whyText: '', setWhyText: this.eiSetWhyText, cantSubmitWhy: true, submitWhy: this.eiSubmitWhy, gradeError: false, modelAnswer: '', whyVerdictLabel: '', whyFeedback: '', connQuestion: '', connText: '', setConnText: this.eiSetConnText, gotIt: this.eiGotIt, gotItLabel: 'GOT IT →', summaryLine: '', summaryRows: [], restart: this.eiRestart, hasPrimer: false, primer: '', hasTerms: false, primerTerms: [], hasChain: false, chainNodes: [], startQuestion: this.eiStartQuestion };
    } else {
      const items = eiSess.items || []; const it = items[eiSess.idx] || { fact: '', why_question: '', connection_question: '', model_answer: '', primer: '', primer_terms: [], chain: [], chain_caption: '' };
      const res = eiSess.result;
      elaborativeUI = {
        phaseLearn: !!eiSess.phaseLearn, phaseGen: false, phaseGenError: false,
        phaseActive: !!eiSess.phaseActive, phaseWhy: !!eiSess.phaseWhy, phaseGrading: !!eiSess.phaseGrading,
        phaseReview: !!eiSess.phaseReview, phaseSummary: !!eiSess.phaseSummary,
        retryGen: this.generateElaborativeItems, num: eiSess.idx + 1, total: items.length,
        fact: it.fact, whyQuestion: it.why_question, connQuestion: it.connection_question,
        modelAnswer: it.model_answer,
        hasPrimer: !!(it.primer), primer: it.primer || '',
        hasTerms: !!(it.primer_terms && it.primer_terms.length), primerTerms: it.primer_terms || [],
        hasChain: !!(it.chain && it.chain.length), chainNodes: it.chain || [], chainCaption: it.chain_caption || '',
        whyText: eiSess.whyText || '', setWhyText: this.eiSetWhyText, cantSubmitWhy: (eiSess.whyText || '').trim().length < 5,
        submitWhy: this.eiSubmitWhy, gradeError: false,
        whyVerdictLabel: res ? (res.verdict === 'correct' ? '✓ CORRECT' : res.verdict === 'partial' ? '~ PARTIAL' : '✗ NEEDS WORK') : '',
        whyFeedback: res ? res.feedback : '',
        connText: eiSess.connText || '', setConnText: this.eiSetConnText, cantSubmitConn: (eiSess.connText || '').trim().length < 5,
        gotIt: this.eiGotIt, gotItLabel: eiSess.idx >= items.length - 1 ? 'FINISH → SUMMARY' : 'GOT IT →',
        summaryLine: items.filter((_: any, i: number) => !eiSess.flags || !eiSess.flags[i]).length + ' of ' + items.length + ' understood well.',
        summaryRows: items.map((x: any, i: number) => { const flagged = !!(eiSess.flags && eiSess.flags[i]); return { fact: x.fact, icon: flagged ? '🚩' : '✅', flagged, modelAnswer: x.model_answer }; }),
        restart: this.eiRestart, startQuestion: this.eiStartQuestion,
      };
    }

    // Concrete examples
    const ceSess = s.session.concrete_examples;
    let concreteUI: any;
    if (!ceSess || ceSess.phase === 'gen' || ceSess.phase === 'genError') {
      concreteUI = { phaseGen: true, phaseGenError: ceSess?.phase === 'genError', phaseCard: false, phaseFeedback: false, phaseSummary: false, retryGen: this.generateConcreteExamples, concept: '', definition: '', revealed: false, reveal: this.ceReveal, example: '', sampleProblem: '', hasSampleProblem: false, connectionQuestion: '', text: '', setText: this.setCEText, cantSubmit: true, submit: this.submitCE, gradeError: false, gotRight: '', missed: '', reinforce: '', correct: false, gotIt: this.ceGotIt, restart: this.ceRestart, summaryRows: [] };
    } else {
      const items = ceSess.items || []; const it = items[ceSess.idx] || { concept: '', plain_definition: '', example: '', sample_problem: '', connection_question: '' };
      const res = ceSess.result;
      concreteUI = {
        phaseGen: false, phaseGenError: false, phaseCard: ceSess.phase === 'card', phaseFeedback: ceSess.phase === 'feedback',
        phaseNewExample: ceSess.phase === 'newExample', phaseGrading: ceSess.phase === 'grading', phaseSummary: ceSess.phase === 'summary',
        retryGen: this.generateConcreteExamples, concept: it.concept, definition: it.plain_definition,
        revealed: !!ceSess.revealed, reveal: this.ceReveal, example: it.example,
        sampleProblem: it.sample_problem || '', hasSampleProblem: !!(it.sample_problem && it.sample_problem.trim()),
        connectionQuestion: it.connection_question,
        text: ceSess.text || '', setText: this.setCEText, cantSubmit: (ceSess.text || '').trim().length <= 5,
        submit: this.submitCE, gradeError: !!ceSess.gradeError,
        gotRight: res ? res.got_right : '', missed: res ? res.missed : '', reinforce: res ? res.reinforce : '', correct: !!(res && res.correct),
        gotIt: this.ceGotIt, restart: this.ceRestart,
        summaryRows: items.map((x: any, i: number) => { const passed = ceSess.flags && ceSess.flags[i] !== false; return { concept: x.concept, icon: passed ? '✅' : '🚩', passed }; }),
        num: ceSess.idx + 1, total: items.length,
      };
    }

    // Self explanation
    const seSess = s.session.self_explanation;
    let seUI: any;
    if (!seSess) {
      seUI = { phaseRead: true, phaseEvaluating: false, phaseFeedback: false, phaseSummary: false, chunkCount: 0, idx: 0, chunk: '', allChunks: [], text: '', setText: this.seSetText, cantSubmit: true, submit: this.seSubmit, verdictIcon: '', verdictStyle: {}, verdictTextColor: '#201E2E', correctFlag: false, wrongFlag: false, feedback: '', simpler: '', gotIt: this.seGotIt, gotItLabel: 'GOT IT →', explainAgain: this.seExplainAgain, firstTryCount: 0, hasStruggled: false, noStruggled: true, struggledCount: 0, struggledRows: [], toFlashcards: this.seToFlashcards, restart: this.seRestart };
    } else {
      const chunks = seSess.chunks || []; const chunk = chunks[seSess.idx] || '';
      const res = seSess.result;
      const sk = Object.keys(seSess.struggled || {});
      seUI = {
        phaseRead: seSess.phase === 'read', phaseEvaluating: seSess.phase === 'evaluating', phaseFeedback: seSess.phase === 'feedback', phaseSummary: seSess.phase === 'summary',
        chunkCount: chunks.length, idx: seSess.idx, chunk, allChunks: chunks.map((c: string, i: number) => ({ text: c, active: i === seSess.idx })),
        text: seSess.text || '', setText: this.seSetText, cantSubmit: (seSess.text || '').trim().length < 5,
        submit: this.seSubmit,
        verdictIcon: res ? (res.correct ? '✅' : '❌') : '', verdictStyle: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: res && res.correct ? '#C9F5E5' : '#FFD9DA', border: '3px solid ' + (res && res.correct ? '#2DD4A7' : '#FF5A5F') },
        verdictTextColor: res && res.correct ? '#14543f' : '#8a1c1f',
        correctFlag: !!(res && res.correct), wrongFlag: !!(res && !res.correct),
        feedback: res ? res.feedback : '', simpler: res ? res.simpler : '',
        gotIt: this.seGotIt, gotItLabel: seSess.idx >= chunks.length - 1 ? 'FINISH → SUMMARY' : 'GOT IT →',
        explainAgain: this.seExplainAgain,
        firstTryCount: chunks.filter((_: any, i: number) => seSess.firstTry && seSess.firstTry[i] === true).length,
        hasStruggled: sk.length > 0, noStruggled: sk.length === 0, struggledCount: sk.length,
        struggledRows: sk.map((k: string) => ({ keyIdea: seSess.struggled[k].keyIdea, chunk: seSess.struggled[k].chunk, simpler: seSess.struggled[k].simpler })),
        toFlashcards: this.seToFlashcards, restart: this.seRestart,
      };
    }

    // Problem sets
    const psSess = s.session.problem_sets;
    const SYMS = ['x', '²', '³', '√', 'π', '≤', '≥', '≠', '±', '·', '/', '(', ')', '∫', 'Δ', '°', '∞', 'θ'];
    let psUI: any;
    if (!psSess || psSess.phase === 'gen' || psSess.phase === 'genError') {
      psUI = { phaseGen: true, phaseGenError: psSess?.phase === 'genError', genErrorText: psSess?.genErrorText || '', phasePick: false, phaseWorked: false, phaseSolve: false, phaseGrading: false, phaseMarked: false, phaseSummary: false, retryGen: this.generateProblemSets, skillRows: [], anyDone: false, toSummary: this.psToSummary, canRetryGen: !this.offlineMode() };
    } else {
      const skills = psSess.skills || []; const sk = skills[psSess.skillIdx] || { skill: '', worked: { problem: '', steps: [] }, practice: [] };
      const prac = (sk.practice || [])[psSess.pIdx] || { problem: '', answer: '', hint: '' };
      const r = psSess.result; const steps = sk.worked.steps || []; const shown = Math.min(psSess.stepsShown || 1, steps.length);
      const solvedKeys = Object.keys(psSess.solved || {}); const errs = Object.entries(psSess.errorTypes || {}).sort((a: any, b: any) => b[1] - a[1]);
      const firstTry = solvedKeys.filter((k: string) => psSess.solved[k] === 'first').length;
      psUI = {
        phaseGen: false, phaseGenError: false, genErrorText: '', phasePick: psSess.phase === 'pick', phaseWorked: psSess.phase === 'worked',
        phaseSolve: psSess.phase === 'solve', phaseGrading: psSess.phase === 'grading', phaseMarked: psSess.phase === 'marked', phaseSummary: psSess.phase === 'summary',
        canRetryGen: !this.offlineMode(), retryGen: this.generateProblemSets,
        skillRows: skills.map((x: any, i: number) => {
          const done = Object.keys(psSess.solved || {}).some((k: string) => k.startsWith(i + ':'));
          return { skill: x.skill, detail: x.practice.length + ' problems', pick: () => this.psPickSkill(i), bg: done ? '#F3FBF8' : '#fff', mark: done ? '✓' : String(i + 1), markBg: done ? '#2DD4A7' : '#EDE7FF', markColor: done ? '#fff' : '#201E2E' };
        }),
        anyDone: solvedKeys.length > 0, toSummary: this.psToSummary,
        skillName: sk.skill, workedProblem: sk.worked.problem,
        revealedSteps: steps.slice(0, shown).map((st: any, i: number) => ({ num: i + 1, step: st.step, why: st.why })),
        moreSteps: shown < steps.length, allStepsShown: shown >= steps.length,
        revealStep: this.psRevealStep, startPractice: this.psStartPractice,
        pNum: psSess.pIdx + 1, pTotal: (sk.practice || []).length,
        stageLabel: psSess.pIdx === 0 ? 'WE DO' : 'YOU DO', stageBg: psSess.pIdx === 0 ? '#FFC93C' : '#2DD4A7',
        problem: prac.problem, hasHint: !!(prac.hint && (psSess.pIdx === 0 || psSess.showHint)), hint: prac.hint || '',
        symbols: SYMS.map((ch: string) => ({ char: ch, tap: () => this.psSymbol(ch) })),
        work: psSess.work || '', setWork: (e: any) => this.psSetWork(e.target.value),
        cantSubmit: !(psSess.work || '').trim(), submit: this.psSubmit, stuck: this.psStuck, gradeError: !!psSess.gradeError,
        verdictHeadStyle: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: r && r.errLine == null ? '#C9F5E5' : '#FFF3DE', border: '3px solid ' + (r && r.errLine == null ? '#2DD4A7' : '#FFC93C') },
        verdictIcon: r && r.errLine == null ? '🎉' : '🔎',
        verdictTitle: r ? (r.errLine == null ? 'Every line checks out.' : 'Line ' + r.errLine + ' is where it went wrong.') : '',
        markedLines: r ? r.lines.map((text: string, i: number) => {
          const n = i + 1; const bad = r.errLine != null && n === r.errLine; const after = r.errLine != null && n > r.errLine;
          return { text: n + '.  ' + text, mark: bad ? '✗' : after ? '' : '✓', markColor: bad ? '#c92c30' : '#2DD4A7', rowStyle: { display: 'flex', flexShrink: 0, gap: '6px', alignItems: 'flex-start', padding: '9px 8px', background: bad ? '#FFD9DA' : after ? 'transparent' : '#F3FBF8', borderLeft: '4px solid ' + (bad ? '#FF5A5F' : after ? 'transparent' : '#2DD4A7') }, textStyle: { fontFamily: "'Courier New',monospace", fontSize: '14px', fontWeight: 700, lineHeight: 1.5, color: '#201E2E', opacity: after ? 0.35 : 1 } };
        }) : [],
        hasError: !!(r && r.errLine != null), errorTypeLabel: r && r.errorType ? r.errorType.toUpperCase() : 'WHAT WENT WRONG',
        errorExplanation: r ? r.explanation : '', hasCorrectLine: !!(r && r.correctLine), correctLine: r ? r.correctLine : '',
        showAnswer: !!(r && r.errLine == null), answer: prac.answer,
        fixIt: this.psFixIt, nextProblem: this.psNextProblem,
        nextLabel: psSess.pIdx + 1 >= (sk.practice || []).length ? 'FINISH SKILL →' : 'NEXT PROBLEM →',
        summaryHeadline: errs.length ? 'Found your pattern.' : 'Clean working!',
        summaryLine: 'You solved ' + firstTry + ' of ' + solvedKeys.length + ' first time' + (solvedKeys.length ? '.' : ', nothing finished yet.'),
        hasPatterns: errs.length > 0, noPatterns: errs.length === 0,
        patternRows: errs.map(([type, count]: any) => ({ type: type.charAt(0).toUpperCase() + type.slice(1), count })),
        backToSkills: this.psBackToSkills,
      };
    }

    // Feynman
    const feynSess = s.session.feynman;
    let feynmanUI: any;
    if (!feynSess || feynSess.phase === 'gen' || feynSess.phase === 'genError') {
      feynmanUI = { phaseGen: true, phaseGenError: feynSess?.phase === 'genError', phaseExplain: false, phaseGrading: false, phaseFeedback: false, phaseSummary: false, retryGen: this.generateFeynman, concept: '', num: 0, total: 0, text: '', setText: this.feynSetText, cantSubmit: true, submit: this.feynSubmit, score: 0, feedback: '', model: '', next: this.feynNext, nextLabel: 'NEXT CONCEPT →', restart: this.feynRestart, toFlashcards: this.feynToFlashcards, summaryRows: [] };
    } else {
      const items = feynSess.items || []; const it = items[feynSess.idx] || { concept: '', question: '' };
      const res = feynSess.result;
      feynmanUI = {
        phaseGen: false, phaseGenError: false, phaseExplain: feynSess.phase === 'explain', phaseGrading: feynSess.phase === 'grading',
        phaseFeedback: feynSess.phase === 'feedback', phaseSummary: feynSess.phase === 'summary',
        retryGen: this.generateFeynman, concept: it.concept, question: it.question, num: feynSess.idx + 1, total: items.length,
        text: feynSess.text || '', setText: this.feynSetText, cantSubmit: (feynSess.text || '').trim().length < 10, submit: this.feynSubmit,
        score: res ? res.score : 0, feedback: res ? res.feedback : '', model: res ? res.model : '',
        next: this.feynNext, nextLabel: feynSess.idx >= items.length - 1 ? 'FINISH → SUMMARY' : 'NEXT CONCEPT →',
        restart: this.feynRestart, toFlashcards: this.feynToFlashcards,
        summaryRows: items.map((x: any, i: number) => ({ concept: x.concept, score: feynSess.scores ? feynSess.scores[i] : 0, icon: (feynSess.scores && feynSess.scores[i] >= 4) ? '✅' : '🚩' })),
      };
    }

    // Chunking
    const chunkSess = s.session.chunking;
    let chunkingUI: any;
    if (!chunkSess || chunkSess.phase === 'gen' || chunkSess.phase === 'genError') {
      chunkingUI = { phaseGen: true, phaseGenError: chunkSess?.phase === 'genError', phaseStudy: false, phaseSummary: false, retryGen: this.generateChunking, chunk: null, num: 0, total: 0, next: this.chunkNext, restart: this.chunkRestart, summaryRows: [], doneCount: 0 };
    } else {
      const chunks = chunkSess.chunks || []; const chunk = chunks[chunkSess.idx] || null;
      chunkingUI = {
        phaseGen: false, phaseGenError: false, phaseStudy: chunkSess.phase === 'study', phaseSummary: chunkSess.phase === 'summary',
        retryGen: this.generateChunking, chunk, num: chunkSess.idx + 1, total: chunks.length,
        pct: chunks.length ? Math.round(100 * Object.keys(chunkSess.done || {}).length / chunks.length) : 0,
        next: this.chunkNext, restart: this.chunkRestart,
        summaryRows: chunks.map((c: any, i: number) => ({ title: c.title, done: !!(chunkSess.done && chunkSess.done[i]) })),
        doneCount: Object.keys(chunkSess.done || {}).length,
      };
    }

    const extractCountdown = s.extracting ? Math.max(0, 45 - Math.floor((s.extractNow - s.extractStartedAt) / 1000)) : 0;
    const keyDraft = ''; const showKeyBox = false; const hasKey = !!(window as any).claude?.key?.get?.();

    return {
      bootFailed: !!s.bootFailed,
      reloadApp: () => window.location.reload(),
      isWelcome: s.screen === 'welcome' && !s.bootFailed,
      showRestartFloat: !s.bootFailed && s.screen !== 'welcome' && s.screen !== 'app',
      restartOpen: !!s.restartOpen, openRestart: this.openRestart, closeRestart: this.closeRestart, confirmRestart: this.confirmRestart,
      editingName: !!s.editingName, notEditingName: !s.editingName,
      age: s.age, hasAge: s.age != null, ageEditDraft: s.ageEditDraft || '', onAgeEditInput: this.onAgeEditInput,
      nameEditDraft: s.nameEditDraft || '', onNameEditInput: this.onNameEditInput,
      startEditName: this.startEditName, saveNameEdit: this.saveNameEdit,
      cantSaveName: !(s.nameEditDraft || '').trim(), nameSaveBg: (s.nameEditDraft || '').trim() ? '#FF6B4A' : '#c9c2b8', nameSaveCursor: (s.nameEditDraft || '').trim() ? 'pointer' : 'default',
      isTutorial: s.screen === 'tutorial', isQuizSubject: s.screen === 'quizSubject', isQuizQuestion: s.screen === 'quizQuestion',
      isResult: s.screen === 'result', isMaterial: s.screen === 'material', isMethodTutorial: s.screen === 'methodTutorial',
      isApp: s.screen === 'app',
      nameDraft: s.nameDraft, onNameInput: this.onNameInput, submitName: this.submitName, ageDraft: s.ageDraft, onAgeInput: this.onAgeInput,
      nameDisabled: !((s.nameDraft || '').trim() && parseInt(s.ageDraft, 10) >= 5 && parseInt(s.ageDraft, 10) <= 99),
      nameBtnColor: ((s.nameDraft || '').trim() && parseInt(s.ageDraft, 10) >= 5 && parseInt(s.ageDraft, 10) <= 99) ? '#FF6B4A' : '#c9c2b8',
      nameBtnCursor: ((s.nameDraft || '').trim() && parseInt(s.ageDraft, 10) >= 5 && parseInt(s.ageDraft, 10) <= 99) ? 'pointer' : 'default',
      mascotName, name: s.name,
      tutorialDots: tutorialSlides.map((_: any, i: number) => ({ active: i === s.tutorialIdx })),
      tutorialTitle: t.title, tutorialBody: t.body,
      tutorialShowBack: s.tutorialIdx > 0, tutorialBack: this.tutorialBack,
      tutorialNext: this.tutorialNext, tutorialNextLabel: s.tutorialIdx < tutorialSlides.length - 1 ? 'NEXT →' : 'START QUIZ →',
      subjectOptions,
      quizStepNum: s.quizIdx + 1, quizPct: Math.round(100 * (s.quizIdx + 1) / mod.QUIZ_QUESTIONS.length) + '%',
      currentQuizQuestion: q ? q.q : '', quizOptions, quizTieColor, quizTieHint,
      quizBack: this.quizBack, quizNext: this.quizNext,
      quizCantNext: quizPicked.length === 0, quizNextBg: quizPicked.length > 0 ? '#FF6B4A' : '#c9c2b8',
      quizNextLabel: s.quizIdx < mod.QUIZ_QUESTIONS.length - 1 ? 'NEXT →' : 'SEE RESULTS →',
      isMaterialModePaste: s.materialMode === 'paste', isMaterialModePhoto: s.materialMode === 'photo', isMaterialModePdf: s.materialMode === 'pdf',
      setMaterialModePaste: this.setMaterialModePaste, setMaterialModePdf: this.setMaterialModePdf, setMaterialModePhoto: this.setMaterialModePhoto,
      pasteTabBg: s.materialMode === 'paste' ? '#201E2E' : '#fff', pasteTabColor: s.materialMode === 'paste' ? '#fff' : '#201E2E',
      pdfTabBg: s.materialMode === 'pdf' ? '#201E2E' : '#fff', pdfTabColor: s.materialMode === 'pdf' ? '#fff' : '#201E2E',
      photoTabBg: s.materialMode === 'photo' ? '#201E2E' : '#fff', photoTabColor: s.materialMode === 'photo' ? '#fff' : '#201E2E',
      materialDraft: s.materialDraft, onMaterialInput: this.onMaterialInput,
      photoStatusText: s.photoStatusText, onPhotoChosen: this.onPhotoChosen,
      pdfStatusText: s.pdfStatusText, onPdfChosen: this.onPdfChosen, pdfLoading: !!s.pdfLoading, photoLoading: !!s.photoLoading,
      showKeyBox, keyStatusText: '', keyDraft, setKeyDraft: () => {}, saveKey: () => {}, cantSaveKey: true, keyBtnBg: '#c9c2b8', keyBtnCursor: 'default', hasKey, clearKey: () => { (window as any).claude.key.set(''); },
      materialCameFromApp: !!s.materialCameFromApp || !!s.fromApp, backToApp: this.backToApp,
      submitMaterial: this.submitMaterial,
      materialDisabled: (s.materialDraft || '').trim().length < 40,
      materialBtnColor: (s.materialDraft || '').trim().length >= 40 ? '#FF6B4A' : '#c9c2b8',
      materialBtnCursor: (s.materialDraft || '').trim().length >= 40 ? 'pointer' : 'default',
      materialHint: (s.materialDraft || '').trim().length < 40 ? 'Need at least a paragraph to work with' : '',
      isProcessing: s.screen === 'processing',
      extractError: !!s.extractError, extractErrorMsg: 'Could not process your notes. Try again or paste more text.',
      cancelExtractToMaterial: this.cancelExtractToMaterial, retryExtract: this.retryExtract,
      extractOk: s.extracting && !s.extractError, extractCountdown,
      mtLabel: mtInfo ? mtInfo.label : '', mtWhyWorks: mtInfo ? mtInfo.whyWorks : '',
      mtSteps: mtInfo ? mtInfo.appSteps.map((text: string, i: number) => ({ n: String(i + 1) + '.', text })) : [],
      startStudying: this.startStudying,
      resultCards, goToMaterial: this.goToMaterial,
      streak: s.streak, xp: s.xp,
      tabToday: s.tab === 'today', tabStudy: s.tab === 'study', tabProgress: s.tab === 'progress', tabCalendar: s.tab === 'calendar', tabMaterial: s.tab === 'material',
      goTabToday: this.goTabToday, goTabStudy: this.goTabStudy, goTabProgress: this.goTabProgress, goTabCalendar: this.goTabCalendar, goTabMaterial: this.goTabMaterial,
      navTodayBg: s.tab === 'today' ? '#201E2E' : '#fff', navTodayColor: s.tab === 'today' ? '#fff' : '#201E2E',
      navStudyBg: s.tab === 'study' ? '#201E2E' : '#fff', navStudyColor: s.tab === 'study' ? '#fff' : '#201E2E',
      navProgressBg: s.tab === 'progress' ? '#201E2E' : '#fff', navProgressColor: s.tab === 'progress' ? '#fff' : '#201E2E',
      navCalendarBg: s.tab === 'calendar' ? '#201E2E' : '#fff', navCalendarColor: s.tab === 'calendar' ? '#fff' : '#201E2E',
      navMaterialBg: s.tab === 'material' ? '#201E2E' : '#fff', navMaterialColor: s.tab === 'material' ? '#fff' : '#201E2E',
      methodChips, pickMethod: this.pickMethod, switchMethod: this.switchMethod,
      planSteps, methodBadges, hasMissed, dueCount: dueItems.length,
      reviewDue: () => {
        const cards = dueItems.slice(0, 20).map((b: any) => ({ question: b.question, answer: b.answer, methodTag: 'active_recall', srKey: b.key }));
        this.sendCardsToActiveRecall(cards);
      },
      isActiveRecall: s.activeMethod === 'active_recall', arUI,
      isBlurting: s.activeMethod === 'blurting', blurtingUI,
      isPomodoro: s.activeMethod === 'pomodoro', pomodoroUI,
      isPractice: s.activeMethod === 'practice_testing', ptUI,
      isElaborative: s.activeMethod === 'elaborative_interrogation', elaborativeUI,
      isConcrete: s.activeMethod === 'concrete_examples', concreteUI,
      isSelfExplanation: s.activeMethod === 'self_explanation', seUI,
      isProblemSets: s.activeMethod === 'problem_sets', psUI,
      isFeynman: s.activeMethod === 'feynman', feynmanUI,
      isChunking: s.activeMethod === 'chunking', chunkingUI,
      activeMethod: s.activeMethod,
      calMonthLabel: monthLabel, calCells: cells, calMonthPrev: this.calMonthPrev, calMonthNext: this.calMonthNext,
      calModeStudied: s.calendarMode === 'studied', calModeTest: s.calendarMode === 'test',
      setCalendarModeStudied: () => this.setCalendarMode('studied'), setCalendarModeTest: () => this.setCalendarMode('test'),
      calStudiedBg: s.calendarMode === 'studied' ? '#2DD4A7' : '#fff', calStudiedColor: s.calendarMode === 'studied' ? '#201E2E' : '#463f52',
      calTestBg: s.calendarMode === 'test' ? '#FFC93C' : '#fff', calTestColor: s.calendarMode === 'test' ? '#201E2E' : '#463f52',
      testDateLabel: s.testDate ? s.testDate : 'Not set – switch to "Set Test Day" and tap a date',
      currentTopic: s.topic, goEditMaterial: this.goEditMaterial,
      askAgeOpen: !!s.askAge,
      saveAskedAge: this.saveAskedAge,
      cantSaveAskedAge: !(parseInt(s.ageDraft, 10) >= 5 && parseInt(s.ageDraft, 10) <= 99),
      askAgeBtnBg: parseInt(s.ageDraft, 10) >= 5 && parseInt(s.ageDraft, 10) <= 99 ? '#FF6B4A' : '#c9c2b8',
      askAgeBtnCursor: parseInt(s.ageDraft, 10) >= 5 && parseInt(s.ageDraft, 10) <= 99 ? 'pointer' : 'default',
      mathNoticeOpen: !!s.mathNoticeOpen, closeMathNotice: this.closeMathNotice, acceptMathMethods: this.acceptMathMethods,
      mathMethodRows: mod.MATH_METHODS.slice(0, 3).map((id: string, i: number) => {
        const m = mod.METHODS.find((x: any) => x.id === id) || { label: id, whyWorks: '' };
        return { rank: i + 1, label: m.label, why: m.whyWorks };
      }),
      hasLibrary: (s.library || []).length > 0,
      libraryRows: (s.library || []).slice().reverse().map((x: any) => {
        const current = x.id === s.currentMaterialId; const renaming = s.renamingId === x.id;
        return { id: x.id, name: x.name, current, renaming, notRenaming: !renaming, detail: (x.concepts || []).length + ' cards' + (x.isMath ? ' · math' : ''), badge: current ? 'STUDYING NOW' : 'TAP TO SWITCH', badgeColor: current ? '#1a9c77' : '#8a8194', rowStyle: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: current ? '#F3FBF8' : '#fff', border: '3px solid ' + (current ? '#2DD4A7' : '#201E2E') }, open: () => this.switchMaterial(x.id), rename: () => this.startRename(x.id) };
      }),
      renameDraft: s.renameDraft || '', onRenameInput: this.onRenameInput, saveRename: this.saveRename, cancelRename: this.cancelRename, cantSaveRename: !(s.renameDraft || '').trim(),
      showAccount: !!s.showAccount, accountDraft: s.accountDraft || '', setAccountDraft: this.setAccountDraft, saveAccount: this.saveAccount, skipAccount: this.skipAccount,
      cantSaveAccount: !(s.accountDraft || '').trim(), accountBtnBg: (s.accountDraft || '').trim() ? '#FF6B4A' : '#c9c2b8', accountBtnBgCursor: (s.accountDraft || '').trim() ? 'pointer' : 'default',
      badgeList, ptHistory: s.ptHistory || [],
      startBlurting: this.extractBlurtTopics,
    };
  }

  render() {
    if (!this.state.contentReady) {
      return <div style={{ height: '100dvh', background: '#FBE8D3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 16, color: '#201E2E' }}>Loading...</div></div>;
    }
    const v = this.renderVals();
    return (
      <div style={css('height:100dvh;min-height:100dvh;width:100%;background:radial-gradient(circle at 20% 10%,#FFF3DE 0%,#FBE8D3 55%,#F6DCC0 100%);display:flex;align-items:center;justify-content:center;padding:clamp(0px,2.2vh,28px) clamp(0px,3vw,16px);box-sizing:border-box;')}>
        <div style={css('width:min(100%,540px);height:100%;max-height:960px;min-height:0;background:#FFF9EF;border:4px solid #201E2E;box-shadow:8px 8px 0 #201E2E;position:relative;overflow:hidden;display:flex;flex-direction:column;')}>
          {v.bootFailed && (
            <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:34px 28px;text-align:center;')}>
              <div style={{ fontSize: 34 }}>🔌</div>
              <div style={css("font-family:'Nunito';font-weight:900;font-size:17px;color:#201E2E;line-height:1.4;")}>Chop couldn't finish loading</div>
              <div style={css('font-size:13px;font-weight:700;color:#8a8194;line-height:1.6;')}>Reload the page to try again.</div>
              <button onClick={v.reloadApp} style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:12px 22px;cursor:pointer;")}>RELOAD</button>
            </div>
          )}
          {v.showRestartFloat && (
            <button onClick={v.openRestart} style={{ position: 'absolute', top: 10, right: 10, zIndex: 60, fontFamily: 'Nunito', fontWeight: 900, fontSize: 11, color: '#fff', background: '#FF5A5F', border: '3px solid #201E2E', boxShadow: '2px 2px 0 #201E2E', padding: '6px 12px', cursor: 'pointer' }}>RESTART</button>
          )}
          {v.restartOpen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(32,30,46,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={css('width:100%;max-width:300px;background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #201E2E;padding:18px;display:flex;flex-direction:column;gap:14px;')}>
                <div style={css('font-size:14px;font-weight:800;color:#201E2E;line-height:1.5;')}>Are you sure you want to restart? It will not save your progress.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={v.confirmRestart} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:13px;color:#fff;background:#FF5A5F;border:3px solid #201E2E;box-shadow:2px 2px 0 #201E2E;padding:10px;cursor:pointer;")}>YES</button>
                  <button onClick={v.closeRestart} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:13px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:10px;cursor:pointer;")}>NO</button>
                </div>
              </div>
            </div>
          )}
          {v.isWelcome && <WelcomeScreen v={v} />}
          {v.isTutorial && <TutorialScreen v={v} />}
          {v.isQuizSubject && <QuizSubjectScreen v={v} />}
          {v.isQuizQuestion && <QuizQuestionScreen v={v} />}
          {v.isMaterial && <MaterialInputScreen v={v} />}
          {v.isProcessing && <ProcessingScreen v={v} />}
          {v.isMethodTutorial && <MethodTutorialScreen v={v} />}
          {v.isResult && <ResultScreen v={v} />}
          {v.isApp && <AppScreen v={v} />}
        </div>
      </div>
    );
  }
}

export default App;
