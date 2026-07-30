import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, scoreQuiz } from '@/lib/content';

const STORAGE_KEY = 'stickpoint_mobile_v1';
const SR_DAYS = [1, 2, 4, 7, 14];

export interface MissedItem {
  key: string;
  question: string;
  answer: string;
  source: string;
  misses: number;
  box: number;
  dueAt: number;
  added: number;
}

export interface LibraryEntry {
  id: string;
  name: string;
  material: string;
  concepts: Card[];
  topic: string;
  isMath: boolean;
  savedAt: number;
  missedBank?: MissedItem[];
  ptHistory?: { date: string; score: number; total: number }[];
  topMethods?: string[] | null;
}

export interface AppState {
  // Onboarding
  name: string;
  age: number | null;
  subjectId: string | null;
  quizAnswers: (number | number[] | null)[];
  topMethods: string[];
  scores: Record<string, number>;

  // Current material
  material: string;
  topic: string;
  concepts: Card[];
  isMath: boolean;

  // Library
  library: LibraryEntry[];
  currentMaterialId: string | null;

  // Progress
  missedBank: MissedItem[];
  streak: number;
  studiedDates: string[];
  sessionsFinished: number;
  methodsTried: Record<string, boolean>;
  ptHistory: { date: string; score: number; total: number }[];

  // Active method
  activeMethod: string;
  materialTopMethods: string[] | null;

  // Internal
  loaded: boolean;
}

const defaultState: AppState = {
  name: '',
  age: null,
  subjectId: null,
  quizAnswers: [],
  topMethods: [],
  scores: {},
  material: '',
  topic: '',
  concepts: [],
  isMath: false,
  library: [],
  currentMaterialId: null,
  missedBank: [],
  streak: 0,
  studiedDates: [],
  sessionsFinished: 0,
  methodsTried: {},
  ptHistory: [],
  activeMethod: 'active_recall',
  materialTopMethods: null,
  loaded: false,
};

interface AppContextValue {
  state: AppState;
  setName: (name: string, age: number) => void;
  setQuizResult: (subjectId: string, answers: (number | number[] | null)[], topMethods: string[], scores: Record<string, number>) => void;
  setMaterial: (material: string, topic: string, concepts: Card[], isMath: boolean) => void;
  setActiveMethod: (method: string) => void;
  recordSession: (method: string) => void;
  recordMissed: (items: { question: string; answer: string }[], source: string) => void;
  gradeMissedItem: (key: string, rating: 'hard' | 'medium' | 'easy') => void;
  addPtResult: (score: number, total: number) => void;
  markStudiedToday: () => void;
  addToLibrary: (entry: Omit<LibraryEntry, 'id' | 'savedAt'>) => string;
  switchMaterial: (id: string) => void;
  deleteFromLibrary: (id: string) => void;
  renameLibraryEntry: (id: string, name: string) => void;
  setMaterialTopMethods: (methods: string[] | null) => void;
  resetApp: () => void;
  dueMissed: () => MissedItem[];
}

const AppContext = createContext<AppContextValue | null>(null);

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dueAtFor(box: number): number {
  const days = SR_DAYS[Math.min(box, SR_DAYS.length - 1)];
  return Date.now() + days * 86400000;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        setState((s) => ({ ...s, loaded: true }));
        return;
      }
      try {
        const persisted = JSON.parse(raw);
        setState((s) => ({ ...s, ...persisted, loaded: true }));
      } catch {
        setState((s) => ({ ...s, loaded: true }));
      }
    });
  }, []);

  const persist = useCallback((patch: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const toSave: Partial<AppState> = {
          name: next.name,
          age: next.age,
          subjectId: next.subjectId,
          quizAnswers: next.quizAnswers,
          topMethods: next.topMethods,
          scores: next.scores,
          material: next.material,
          topic: next.topic,
          concepts: next.concepts,
          isMath: next.isMath,
          library: next.library,
          currentMaterialId: next.currentMaterialId,
          missedBank: next.missedBank,
          streak: next.streak,
          studiedDates: next.studiedDates,
          sessionsFinished: next.sessionsFinished,
          methodsTried: next.methodsTried,
          ptHistory: next.ptHistory,
          activeMethod: next.activeMethod,
          materialTopMethods: next.materialTopMethods,
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      }, 300);
      return next;
    });
  }, []);

  const setName = useCallback((name: string, age: number) => {
    persist({ name, age });
  }, [persist]);

  const setQuizResult = useCallback((
    subjectId: string,
    answers: (number | number[] | null)[],
    topMethods: string[],
    scores: Record<string, number>,
  ) => {
    persist({ subjectId, quizAnswers: answers, topMethods, scores });
  }, [persist]);

  const setMaterial = useCallback((material: string, topic: string, concepts: Card[], isMath: boolean) => {
    setState((prev) => {
      const id = 'm' + Date.now();
      const entry: LibraryEntry = { id, name: topic, material, concepts, topic, isMath, savedAt: Date.now() };
      const library = [...(prev.library || []), entry];
      const next = { ...prev, material, topic, concepts, isMath, library, currentMaterialId: id, materialTopMethods: null };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }, 300);
      return next;
    });
  }, []);

  const setActiveMethod = useCallback((method: string) => {
    persist({ activeMethod: method });
  }, [persist]);

  const recordSession = useCallback((method: string) => {
    setState((prev) => {
      const today = dayKey(Date.now());
      const studiedDates = prev.studiedDates.includes(today)
        ? prev.studiedDates
        : [...prev.studiedDates, today];
      // Calculate streak
      let streak = 0;
      const sorted = [...studiedDates].sort().reverse();
      for (let i = 0; i < sorted.length; i++) {
        const expected = dayKey(Date.now() - i * 86400000);
        if (sorted[i] === expected) streak++;
        else break;
      }
      const methodsTried = { ...prev.methodsTried, [method]: true };
      const next = {
        ...prev,
        sessionsFinished: (prev.sessionsFinished || 0) + 1,
        studiedDates,
        streak,
        methodsTried,
      };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }, 300);
      return next;
    });
  }, []);

  const recordMissed = useCallback((items: { question: string; answer: string }[], source: string) => {
    setState((prev) => {
      if (!items?.length) return prev;
      const bank = [...(prev.missedBank || [])];
      items.forEach((it) => {
        const q = String(it.question || '').trim();
        const a = String(it.answer || '').trim();
        if (!q || !a) return;
        const key = q.toLowerCase().slice(0, 120);
        const found = bank.find((b) => b.key === key);
        if (found) {
          found.misses = (found.misses || 1) + 1;
          found.box = 0;
          found.dueAt = dueAtFor(0);
        } else {
          bank.push({ key, question: q, answer: a, source, misses: 1, box: 0, dueAt: dueAtFor(0), added: Date.now() });
        }
      });
      const newBank = bank.slice(-120);
      // Also persist into the current library entry so switching materials doesn't lose it
      const library = prev.currentMaterialId
        ? prev.library.map((e) =>
            e.id === prev.currentMaterialId ? { ...e, missedBank: newBank } : e
          )
        : prev.library;
      const next = { ...prev, missedBank: newBank, library };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }, 300);
      return next;
    });
  }, []);

  const gradeMissedItem = useCallback((key: string, rating: 'hard' | 'medium' | 'easy') => {
    setState((prev) => {
      const bank = [...(prev.missedBank || [])];
      const item = bank.find((b) => b.key === key);
      if (!item) return prev;
      if (rating === 'hard') { item.box = 0; item.misses = (item.misses || 1) + 1; }
      else if (rating === 'easy') { item.box = Math.min(SR_DAYS.length - 1, (item.box || 0) + 1); }
      item.dueAt = dueAtFor(item.box);
      const next = { ...prev, missedBank: bank };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }, 300);
      return next;
    });
  }, []);

  const addPtResult = useCallback((score: number, total: number) => {
    setState((prev) => {
      const newHistory = [
        ...(prev.ptHistory || []),
        { date: new Date().toLocaleDateString(), score, total },
      ].slice(-20);
      // Also persist into the current library entry
      const library = prev.currentMaterialId
        ? prev.library.map((e) =>
            e.id === prev.currentMaterialId ? { ...e, ptHistory: newHistory } : e
          )
        : prev.library;
      const next = { ...prev, ptHistory: newHistory, library };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }, 300);
      return next;
    });
  }, []);

  const markStudiedToday = useCallback(() => {
    const today = dayKey(Date.now());
    if (!state.studiedDates.includes(today)) {
      persist({ studiedDates: [...state.studiedDates, today] });
    }
  }, [persist, state.studiedDates]);

  const addToLibrary = useCallback((entry: Omit<LibraryEntry, 'id' | 'savedAt'>): string => {
    const id = 'm' + Date.now();
    const full: LibraryEntry = { ...entry, id, savedAt: Date.now() };
    persist({ library: [...state.library, full] });
    return id;
  }, [persist, state.library]);

  const switchMaterial = useCallback((id: string) => {
    const entry = state.library.find((e) => e.id === id);
    if (!entry) return;
    persist({
      currentMaterialId: id,
      material: entry.material,
      topic: entry.topic,
      concepts: entry.concepts,
      isMath: entry.isMath,
      missedBank: entry.missedBank || [],
      ptHistory: entry.ptHistory || [],
      materialTopMethods: entry.topMethods ?? null,
    });
  }, [persist, state.library]);

  const deleteFromLibrary = useCallback((id: string) => {
    const library = state.library.filter((e) => e.id !== id);
    const patch: Partial<AppState> = { library };
    if (state.currentMaterialId === id) {
      if (library.length > 0) {
        const next = library[library.length - 1];
        patch.currentMaterialId = next.id;
        patch.material = next.material;
        patch.topic = next.topic;
        patch.concepts = next.concepts;
        patch.isMath = next.isMath;
        patch.missedBank = next.missedBank || [];
        patch.ptHistory = next.ptHistory || [];
        patch.materialTopMethods = next.topMethods ?? null;
      } else {
        // No entries left — clear current material
        patch.currentMaterialId = null;
        patch.material = '';
        patch.topic = '';
        patch.concepts = [];
        patch.isMath = false;
        patch.missedBank = [];
        patch.ptHistory = [];
        patch.materialTopMethods = null;
      }
    }
    persist(patch);
  }, [persist, state.library, state.currentMaterialId]);

  const renameLibraryEntry = useCallback((id: string, name: string) => {
    const library = state.library.map((e) => e.id === id ? { ...e, name } : e);
    persist({ library });
  }, [persist, state.library]);

  const setMaterialTopMethods = useCallback((methods: string[] | null) => {
    persist({ materialTopMethods: methods });
  }, [persist]);

  const resetApp = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY);
    setState({ ...defaultState, loaded: true });
  }, []);

  const dueMissed = useCallback((): MissedItem[] => {
    const now = Date.now();
    return (state.missedBank || [])
      .filter((b) => (b.dueAt || 0) <= now)
      .sort((a, b) => (b.misses || 0) - (a.misses || 0));
  }, [state.missedBank]);

  return (
    <AppContext.Provider value={{
      state,
      setName, setQuizResult, setMaterial, setActiveMethod, recordSession,
      recordMissed, gradeMissedItem, addPtResult, markStudiedToday,
      addToLibrary, switchMaterial, deleteFromLibrary, renameLibraryEntry,
      setMaterialTopMethods, resetApp, dueMissed,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

const MOBILE_METHODS = [
  'active_recall', 'blurting', 'feynman', 'practice_testing',
  'self_explanation', 'elaborative_interrogation', 'pomodoro', 'problem_sets',
];

export function useEffectiveMethods(state: AppState): string[] {
  const recommended = (state.materialTopMethods ?? state.topMethods)
    .filter((m: string) => MOBILE_METHODS.includes(m));
  // Recommended first, then remaining mobile methods
  const all = [...new Set([...recommended, ...MOBILE_METHODS])];
  return all;
}
