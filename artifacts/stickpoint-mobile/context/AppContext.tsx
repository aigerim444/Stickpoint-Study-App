import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, accountsEnabled } from '@/lib/supabase';
import { postEvent, pullState, pushState } from '@/lib/sync';
import {
  Card,
  MissedItem,
  computeStreak,
  dueMissed as coreDueMissed,
  gradeMissedItem as coreGradeMissedItem,
  markStudiedToday as coreMarkStudiedToday,
  recordMissed as coreRecordMissed,
  scoreQuiz,
} from '@/lib/content';

const STORAGE_KEY = 'stickpoint_mobile_v1';
const SYNC_META_KEY = 'stickpoint_sync_meta_v1';

export type { MissedItem };

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

  // Rewards
  xp: number;

  // Preferences
  tourSeen: boolean;
  soundOn: boolean;

  // Planning
  testDate: string | null; // YYYY-MM-DD

  // Notifications
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;

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
  xp: 0,
  tourSeen: false,
  soundOn: true,
  testDate: null,
  notificationsEnabled: false,
  notificationHour: 20,
  notificationMinute: 0,
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
  setTestDate: (date: string | null) => void;
  addXp: (n: number) => void;
  setTourSeen: (seen: boolean) => void;
  setSoundOn: (on: boolean) => void;
  /** Manually toggle a past/today day as studied (the prototype's MARK STUDIED mode). */
  toggleStudiedDay: (key: string) => void;
  setNotificationPreference: (enabled: boolean, hour: number, minute: number) => void;
  resetApp: () => void;
  dueMissed: () => MissedItem[];
  /** Signed-in account email, or null. Always null when accounts are disabled. */
  account: { email: string } | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Account + snapshot sync ----
  // The server is the source of truth once signed in. We track the server
  // timestamp we last reconciled with (sync meta, stored under its own key)
  // and push a debounced snapshot after every local save. Conflicts are
  // last-write-wins: a 409 hands us the newer server copy and we adopt it.
  const [account, setAccount] = useState<{ email: string } | null>(null);
  const signedInRef = useRef(false);
  const syncMetaRef = useRef<{ updatedAt: number }>({ updatedAt: 0 });
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const setSyncMeta = useCallback((updatedAt: number) => {
    syncMetaRef.current = { updatedAt };
    AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify({ updatedAt })).catch(() => {});
  }, []);

  const snapshotOf = useCallback((s: AppState): Record<string, unknown> => {
    const { loaded: _loaded, ...rest } = s;
    return rest;
  }, []);

  const adoptServerState = useCallback((serverState: Record<string, unknown>, updatedAt: number) => {
    setState((prev) => {
      const next = { ...defaultState, ...(serverState as Partial<AppState>), loaded: true };
      // Recompute the streak locally; the snapshot's copy may be stale.
      next.streak = Array.isArray(next.studiedDates) ? computeStreak(next.studiedDates, Date.now()) : 0;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    setSyncMeta(updatedAt);
  }, [setSyncMeta]);

  const schedulePush = useCallback((next: AppState) => {
    if (!signedInRef.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      const result = await pushState(snapshotOf(next), syncMetaRef.current.updatedAt);
      if (result.ok) setSyncMeta(result.updatedAt);
      else if (result.conflict) adoptServerState(result.conflict.state, result.conflict.updatedAt);
    }, 2000);
  }, [snapshotOf, setSyncMeta, adoptServerState]);

  /** Local save + (when signed in) debounced server push. */
  const saveAndSync = useCallback((next: AppState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    schedulePush(next);
  }, [schedulePush]);

  const reconcileWithServer = useCallback(async () => {
    const pulled = await pullState();
    if (pulled === null) return; // offline or server hiccup — try again next launch
    if (pulled === 'empty' || pulled.updatedAt <= syncMetaRef.current.updatedAt) {
      // Server has nothing newer: our local copy becomes the server copy.
      const result = await pushState(snapshotOf(stateRef.current), syncMetaRef.current.updatedAt);
      if (result.ok) setSyncMeta(result.updatedAt);
      else if (result.conflict) adoptServerState(result.conflict.state, result.conflict.updatedAt);
    } else {
      adoptServerState(pulled.state, pulled.updatedAt);
    }
  }, [snapshotOf, setSyncMeta, adoptServerState]);

  useEffect(() => {
    if (!supabase) return;
    AsyncStorage.getItem(SYNC_META_KEY).then((raw) => {
      if (raw) {
        try { syncMetaRef.current = JSON.parse(raw); } catch {}
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      signedInRef.current = !!data.session;
      setAccount(email ? { email } : null);
      if (data.session) reconcileWithServer();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      signedInRef.current = !!session;
      setAccount(session?.user?.email ? { email: session.user.email } : null);
      if (event === 'SIGNED_IN') reconcileWithServer();
      if (event === 'SIGNED_OUT') setSyncMeta(0);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        setState((s) => ({ ...s, loaded: true }));
        return;
      }
      try {
        const persisted = JSON.parse(raw);
        // Recompute streak from studiedDates so missed days are reflected
        // immediately on load — the persisted streak value can be stale.
        const computedStreak = Array.isArray(persisted.studiedDates)
          ? computeStreak(persisted.studiedDates, Date.now())
          : 0;
        setState((s) => ({ ...s, ...persisted, streak: computedStreak, loaded: true }));
      } catch {
        setState((s) => ({ ...s, loaded: true }));
      }
    });
  }, []);

  const persist = useCallback((patch: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveAndSync(next), 300);
      return next;
    });
  }, [saveAndSync]);

  const setName = useCallback((name: string, age: number) => {
    persist({ name, age });
    postEvent('onboarding_started');
  }, [persist]);

  const setQuizResult = useCallback((
    subjectId: string,
    answers: (number | number[] | null)[],
    topMethods: string[],
    scores: Record<string, number>,
  ) => {
    persist({ subjectId, quizAnswers: answers, topMethods, scores });
    postEvent('quiz_completed', undefined, { subjectId, topMethods });
  }, [persist]);

  const setMaterial = useCallback((material: string, topic: string, concepts: Card[], isMath: boolean) => {
    setState((prev) => {
      const id = 'm' + Date.now();
      const entry: LibraryEntry = { id, name: topic, material, concepts, topic, isMath, savedAt: Date.now() };
      const library = [...(prev.library || []), entry];
      postEvent('material_added', undefined, { isMath });
      // Per-material progress starts fresh — the previous material's missed
      // bank and test history live in its own library entry, not here.
      const next = {
        ...prev, material, topic, concepts, isMath, library, currentMaterialId: id,
        materialTopMethods: null, missedBank: [], ptHistory: [],
      };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveAndSync(next);
      }, 300);
      return next;
    });
  }, []);

  const setActiveMethod = useCallback((method: string) => {
    persist({ activeMethod: method });
  }, [persist]);

  const recordSession = useCallback((method: string) => {
    setState((prev) => {
      const { studiedDates, streak } = coreMarkStudiedToday(prev.studiedDates, Date.now());
      const methodsTried = { ...prev.methodsTried, [method]: true };
      postEvent('session_completed', method, { total: (prev.sessionsFinished || 0) + 1 });
      const next = {
        ...prev,
        sessionsFinished: (prev.sessionsFinished || 0) + 1,
        studiedDates,
        streak,
        methodsTried,
      };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveAndSync(next);
      }, 300);
      return next;
    });
  }, []);

  const recordMissed = useCallback((items: { question: string; answer: string }[], source: string) => {
    setState((prev) => {
      if (!items?.length) return prev;
      const newBank = coreRecordMissed(prev.missedBank || [], items, source, Date.now(), prev.topic || 'Your notes');
      // Also persist into the current library entry so switching materials doesn't lose it
      const library = prev.currentMaterialId
        ? prev.library.map((e) =>
            e.id === prev.currentMaterialId ? { ...e, missedBank: newBank } : e
          )
        : prev.library;
      const next = { ...prev, missedBank: newBank, library };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { saveAndSync(next); }, 300);
      return next;
    });
  }, []);

  const gradeMissedItem = useCallback((key: string, rating: 'hard' | 'medium' | 'easy') => {
    setState((prev) => {
      if (!(prev.missedBank || []).some((b) => b.key === key)) return prev;
      const bank = coreGradeMissedItem(prev.missedBank || [], key, rating, Date.now());
      const next = { ...prev, missedBank: bank };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { saveAndSync(next); }, 300);
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
      saveTimer.current = setTimeout(() => { saveAndSync(next); }, 300);
      return next;
    });
  }, []);

  const markStudiedToday = useCallback(() => {
    const { studiedDates, streak } = coreMarkStudiedToday(state.studiedDates, Date.now());
    if (studiedDates !== state.studiedDates) persist({ studiedDates, streak });
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

  const setTestDate = useCallback((date: string | null) => {
    persist({ testDate: date });
  }, [persist]);

  const addXp = useCallback((n: number) => {
    setState((prev) => {
      const next = { ...prev, xp: (prev.xp || 0) + n };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveAndSync(next), 300);
      return next;
    });
  }, [saveAndSync]);

  const setTourSeen = useCallback((seen: boolean) => {
    persist({ tourSeen: seen });
  }, [persist]);

  const setSoundOn = useCallback((on: boolean) => {
    persist({ soundOn: on });
  }, [persist]);

  const toggleStudiedDay = useCallback((key: string) => {
    setState((prev) => {
      const has = prev.studiedDates.includes(key);
      const studiedDates = has
        ? prev.studiedDates.filter((d) => d !== key)
        : [...prev.studiedDates, key];
      const next = { ...prev, studiedDates, streak: computeStreak(studiedDates, Date.now()) };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveAndSync(next), 300);
      return next;
    });
  }, [saveAndSync]);

  const setNotificationPreference = useCallback(
    (enabled: boolean, hour: number, minute: number) => {
      persist({ notificationsEnabled: enabled, notificationHour: hour, notificationMinute: minute });
    },
    [persist],
  );

  const resetApp = useCallback(() => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    AsyncStorage.removeItem(STORAGE_KEY);
    AsyncStorage.removeItem(SYNC_META_KEY);
    const lastServerAt = syncMetaRef.current.updatedAt;
    syncMetaRef.current = { updatedAt: 0 };
    const wiped = { ...defaultState, loaded: true };
    setState(wiped);
    // A signed-in restart must overwrite the server snapshot too — otherwise
    // the next sync pulls all the old data straight back.
    if (signedInRef.current) {
      (async () => {
        let result = await pushState(snapshotOf(wiped), lastServerAt);
        if (!result.ok && result.conflict) {
          result = await pushState(snapshotOf(wiped), result.conflict.updatedAt);
        }
        if (result.ok) setSyncMeta(result.updatedAt);
      })();
    }
  }, [snapshotOf, setSyncMeta]);

  const dueMissed = useCallback(
    (): MissedItem[] => coreDueMissed(state.missedBank || [], Date.now()),
    [state.missedBank],
  );

  return (
    <AppContext.Provider value={{
      state,
      setName, setQuizResult, setMaterial, setActiveMethod, recordSession,
      recordMissed, gradeMissedItem, addPtResult, markStudiedToday,
      addToLibrary, switchMaterial, deleteFromLibrary, renameLibraryEntry,
      setMaterialTopMethods, setTestDate, setNotificationPreference, resetApp, dueMissed,
      addXp, setTourSeen, setSoundOn, toggleStudiedDay,
      account: accountsEnabled ? account : null,
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
  'active_recall', 'blurting', 'feynman', 'practice_testing', 'concrete_examples',
  'self_explanation', 'elaborative_interrogation', 'pomodoro', 'problem_sets',
];

export function useEffectiveMethods(state: AppState): string[] {
  const recommended = (state.materialTopMethods ?? state.topMethods)
    .filter((m: string) => MOBILE_METHODS.includes(m));
  // Recommended first, then remaining mobile methods
  const all = [...new Set([...recommended, ...MOBILE_METHODS])];
  return all;
}
