import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import {
  generateProblemSets, gradeProblemStep,
  PsSkill, PsFigure, PsGradeResult,
} from '@/lib/api';
import { Card } from '@/lib/content';

const PS_CACHE_VERSION = 'ps_v1';

/** djb2 hash — fast, no dependencies, good enough for a cache key */
function hashNotes(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h >>>= 0; // keep unsigned 32-bit
  }
  return h.toString(36);
}

async function loadCachedSkills(notes: string): Promise<PsSkill[] | null> {
  try {
    const key = `${PS_CACHE_VERSION}_${hashNotes(notes)}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PsSkill[];
    return null;
  } catch {
    return null;
  }
}

async function cacheSkills(notes: string, skills: PsSkill[]): Promise<void> {
  try {
    const key = `${PS_CACHE_VERSION}_${hashNotes(notes)}`;
    await AsyncStorage.setItem(key, JSON.stringify(skills));
  } catch {
    // cache write failure is non-fatal
  }
}

interface PsProgress {
  solved: Record<string, 'first' | 'eventually'>;
  errorTypes: Record<string, number>;
  attempts: Record<string, number>;
}

const PS_PROGRESS_VERSION = 'ps_progress_v1';

async function loadCachedProgress(notes: string): Promise<PsProgress | null> {
  try {
    const key = `${PS_PROGRESS_VERSION}_${hashNotes(notes)}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PsProgress;
  } catch {
    return null;
  }
}

async function saveProgress(notes: string, progress: PsProgress): Promise<void> {
  try {
    const key = `${PS_PROGRESS_VERSION}_${hashNotes(notes)}`;
    await AsyncStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // non-fatal
  }
}

async function clearProgress(notes: string): Promise<void> {
  try {
    const key = `${PS_PROGRESS_VERSION}_${hashNotes(notes)}`;
    await AsyncStorage.removeItem(key);
  } catch {
    // non-fatal
  }
}

interface Props {
  notes: string;
  name: string;
  age: number | null;
  onComplete: (hard: Card[]) => void;
  onBack: () => void;
}

type Phase = 'gen' | 'gen_error' | 'pick' | 'worked' | 'solve' | 'grading' | 'marked' | 'summary';

interface SessionState {
  skills: PsSkill[];
  skillIdx: number;
  stepsShown: number;
  pIdx: number;
  work: string;
  result: PsGradeResult | null;
  attempts: Record<string, number>;
  solved: Record<string, 'first' | 'eventually'>;
  errorTypes: Record<string, number>;
  gradeError: boolean;
  notMath: boolean;
  showHint: boolean;
}

function Figure({ fig }: { fig: PsFigure }) {
  const colors = useColors();
  if (fig.type === 'table' && fig.headers && fig.rows) {
    return (
      <View style={[figStyles.tableWrap, { borderColor: colors.dark }]}>
        <View style={[figStyles.tableRow, { backgroundColor: colors.secondary }]}>
          {fig.headers.map((h, i) => (
            <Text key={i} style={[figStyles.th, { color: colors.dark, flex: 1 }]}>{h}</Text>
          ))}
        </View>
        {fig.rows.map((row, ri) => (
          <View key={ri} style={[figStyles.tableRow, { borderTopWidth: 1, borderColor: colors.secondary }]}>
            {row.map((cell, ci) => (
              <Text key={ci} style={[figStyles.td, { color: colors.dark, flex: 1 }]}>{cell}</Text>
            ))}
          </View>
        ))}
        {fig.caption ? <Text style={[figStyles.caption, { color: colors.muted }]}>{fig.caption}</Text> : null}
      </View>
    );
  }
  if (fig.type === 'chart' && fig.bars) {
    const max = Math.max(...fig.bars.map((b) => b.value), 1);
    return (
      <View style={figStyles.chartWrap}>
        {fig.bars.map((b, i) => (
          <View key={i} style={figStyles.barRow}>
            <Text style={[figStyles.barLabel, { color: colors.muted }]} numberOfLines={1}>{b.label}</Text>
            <View style={[figStyles.barTrack, { backgroundColor: colors.secondary }]}>
              <View style={[figStyles.barFill, { width: `${(b.value / max) * 100}%` as any, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[figStyles.barVal, { color: colors.dark }]}>{b.value}</Text>
          </View>
        ))}
        {fig.caption ? <Text style={[figStyles.caption, { color: colors.muted }]}>{fig.caption}</Text> : null}
      </View>
    );
  }
  if (fig.type === 'diagram' && fig.art) {
    return (
      <View style={figStyles.diagramWrap}>
        <Text style={figStyles.diagramArt}>{fig.art}</Text>
        {fig.caption ? <Text style={[figStyles.caption, { color: '#6b7280' }]}>{fig.caption}</Text> : null}
      </View>
    );
  }
  return null;
}

export default function ProblemSets({ notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [phase, setPhase] = useState<Phase>('gen');
  const [sess, setSess] = useState<SessionState>({
    skills: [], skillIdx: 0, stepsShown: 1, pIdx: 0,
    work: '', result: null, attempts: {}, solved: {}, errorTypes: {},
    gradeError: false, notMath: false, showHint: false,
  });
  const generatedRef = useRef(false);

  // Generate on mount — check cache first
  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    (async () => {
      // Try cache before hitting the API
      const cached = await loadCachedSkills(notes);
      if (cached && cached.length > 0) {
        const progress = await loadCachedProgress(notes);
        setSess((s) => ({
          ...s,
          skills: cached,
          solved: progress?.solved ?? {},
          errorTypes: progress?.errorTypes ?? {},
          attempts: progress?.attempts ?? {},
        }));
        setPhase('pick');
        return;
      }

      const res = await generateProblemSets(notes, name, age);
      if (res === 'not_math') {
        setSess((s) => ({ ...s, notMath: true }));
        setPhase('gen_error');
      } else if (!res) {
        setPhase('gen_error');
      } else {
        await cacheSkills(notes, res.skills);
        setSess((s) => ({ ...s, skills: res.skills }));
        setPhase('pick');
      }
    })();
  }, []);

  const update = useCallback((patch: Partial<SessionState>) => {
    setSess((s) => ({ ...s, ...patch }));
  }, []);

  // ── PICK ──────────────────────────────────────────────────────────────────
  const pickSkill = useCallback((i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    update({ skillIdx: i, stepsShown: 1, pIdx: 0, work: '', result: null });
    setPhase('worked');
  }, [update]);

  // ── WORKED ────────────────────────────────────────────────────────────────
  const revealStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update({ stepsShown: sess.stepsShown + 1 });
  }, [sess.stepsShown, update]);

  const startPractice = useCallback(() => {
    update({ pIdx: 0, work: '', result: null, gradeError: false, showHint: false });
    setPhase('solve');
  }, [update]);

  // ── SOLVE ─────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    const lines = sess.work.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const skill = sess.skills[sess.skillIdx];
    const prob = skill.practice[sess.pIdx];
    const res = await gradeProblemStep(skill.skill, prob.problem, prob.answer, lines, name, age);
    if (!res) {
      update({ gradeError: true });
      setPhase('solve');
      return;
    }
    const key = `${sess.skillIdx}:${sess.pIdx}`;
    const attempts = { ...sess.attempts, [key]: (sess.attempts[key] || 0) + 1 };
    const solved = { ...sess.solved };
    const errorTypes = { ...sess.errorTypes };
    if (res.errLine == null && res.reached) {
      solved[key] = attempts[key] === 1 ? 'first' : 'eventually';
    } else if (res.errorType) {
      const t = res.errorType.toLowerCase();
      errorTypes[t] = (errorTypes[t] || 0) + 1;
    }
    update({ result: res, attempts, solved, errorTypes, gradeError: false });
    setPhase('marked');
    // Persist progress so ✓ DONE badges survive across sessions
    saveProgress(notes, { solved, errorTypes, attempts });
  }, [sess, name, age, notes, update]);

  const fixIt = useCallback(() => {
    const r = sess.result;
    const kept = r?.errLine ? r.lines.slice(0, r.errLine - 1) : [];
    update({ work: kept.length ? kept.join('\n') + '\n' : '', result: null, gradeError: false, showHint: false });
    setPhase('solve');
  }, [sess.result, update]);

  const nextProblem = useCallback(() => {
    const skill = sess.skills[sess.skillIdx];
    if (sess.pIdx + 1 >= skill.practice.length) {
      setPhase('summary');
      // collect hard cards from errorTypes
      const hard: Card[] = Object.entries(sess.errorTypes).map(([type]) => ({
        question: `Fix your ${type} errors`,
        answer: `Review: ${skill.skill}`,
        methodTag: 'problem_sets',
      }));
      onComplete(hard);
      return;
    }
    update({ pIdx: sess.pIdx + 1, work: '', result: null, gradeError: false, showHint: false });
    setPhase('solve');
  }, [sess, update, onComplete]);

  const backToSkills = useCallback(() => {
    update({ work: '', result: null });
    setPhase('pick');
  }, [update]);

  // ── REGENERATE ────────────────────────────────────────────────────────────
  const regenerate = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Bust the skill cache and progress cache for these notes
    try {
      const hash = hashNotes(notes);
      await AsyncStorage.multiRemove([
        `${PS_CACHE_VERSION}_${hash}`,
        `${PS_PROGRESS_VERSION}_${hash}`,
      ]);
    } catch {
      // non-fatal
    }
    // Reset all session progress and go back to the gen loading screen
    setSess({
      skills: [], skillIdx: 0, stepsShown: 1, pIdx: 0,
      work: '', result: null, attempts: {}, solved: {}, errorTypes: {},
      gradeError: false, notMath: false, showHint: false,
    });
    setPhase('gen');
    const res = await generateProblemSets(notes, name, age);
    if (res === 'not_math') {
      setSess((s) => ({ ...s, notMath: true }));
      setPhase('gen_error');
    } else if (!res) {
      setPhase('gen_error');
    } else {
      await cacheSkills(notes, res.skills);
      setSess((s) => ({ ...s, skills: res.skills }));
      setPhase('pick');
    }
  }, [notes, name, age]);

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const totalSolved = Object.keys(sess.solved).length;
  const topErrors = Object.entries(sess.errorTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (phase === 'gen') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background, gap: 16 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>BUILDING YOUR PROBLEM SET…</Text>
        <Text style={[styles.hint, { color: colors.subtle, textAlign: 'center', paddingHorizontal: 32 }]}>
          Chop is finding the problem types in your notes and writing worked examples. This takes about a minute.
        </Text>
      </View>
    );
  }

  if (phase === 'gen_error') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.red }]}>
          <Text style={[styles.heading, { color: colors.dark }]}>
            {sess.notMath ? 'These notes look like prose' : 'Couldn\'t build a problem set'}
          </Text>
          <Text style={[styles.body, { color: colors.subtle }]}>
            {sess.notMath
              ? 'Problem Sets works best when your notes have equations or procedures to practise. Try Active Recall or Blurting for vocabulary-heavy material.'
              : 'Something went wrong generating your problem set. Check your connection and try again.'}
          </Text>
        </View>
        <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>BACK TO METHODS</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'pick') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>PICK A SKILL TO PRACTISE</Text>
        {sess.skills.map((sk, i) => {
          const key0 = `${i}:0`;
          const done = sk.practice.every((_, pi) => sess.solved[`${i}:${pi}`]);
          return (
            <Pressable
              key={i}
              onPress={() => pickSkill(i)}
              style={({ pressed }) => [
                styles.skillCard,
                { borderColor: colors.dark, backgroundColor: done ? colors.greenLight : colors.card, opacity: pressed ? 0.85 : 1 },
              ]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.skillName, { color: colors.dark }]}>{sk.skill}</Text>
                <Text style={[styles.skillSub, { color: colors.muted }]}>
                  {sk.practice.length} practice problem{sk.practice.length !== 1 ? 's' : ''}
                  {done ? ' · ✓ DONE' : ''}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          );
        })}
        {Object.keys(sess.solved).length > 0 && (
          <Pressable onPress={() => setPhase('summary')} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark, marginTop: 6 }]}>
            <Text style={[styles.btnText, { color: '#fff' }]}>SEE MY ERROR PATTERNS →</Text>
          </Pressable>
        )}
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
        <Pressable onPress={regenerate} style={styles.regenLink}>
          <Feather name="refresh-cw" size={13} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>regenerate questions</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'worked') {
    const skill = sess.skills[sess.skillIdx];
    const revealed = skill.worked.steps.slice(0, sess.stepsShown);
    const moreSteps = sess.stepsShown < skill.worked.steps.length;
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={styles.phaseRow}>
          <Pressable onPress={backToSkills} style={[styles.smallBtn, { borderColor: colors.dark }]}>
            <Text style={[styles.smallBtnText, { color: colors.dark }]}>← SKILLS</Text>
          </Pressable>
          <View style={[styles.phaseBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.phaseBadgeText}>I DO</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{skill.skill.toUpperCase()}</Text>

        <View style={[styles.card, { borderColor: colors.dark }]}>
          <Text style={[styles.miniLabel, { color: colors.muted }]}>WORKED EXAMPLE</Text>
          <Text style={[styles.problem, { color: colors.dark }]}>{skill.worked.problem}</Text>
          {skill.worked.figure && <Figure fig={skill.worked.figure} />}
        </View>

        {revealed.map((st, i) => (
          <View key={i} style={[styles.stepCard, { borderColor: i === revealed.length - 1 ? colors.primary : colors.secondary }]}>
            <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.stepMath, { color: colors.dark }]}>{st.step}</Text>
              <Text style={[styles.stepWhy, { color: colors.subtle }]}>↳ {st.why}</Text>
            </View>
          </View>
        ))}

        {moreSteps ? (
          <Pressable onPress={revealStep} style={[styles.btn, { backgroundColor: colors.yellow, borderColor: colors.dark }]}>
            <Text style={[styles.btnText, { color: colors.dark }]}>SHOW ME THE NEXT STEP ↓</Text>
          </Pressable>
        ) : (
          <Pressable onPress={startPractice} style={[styles.btn, { backgroundColor: colors.accent, borderColor: colors.dark }]}>
            <Text style={[styles.btnText, { color: '#fff' }]}>MY TURN — GIVE ME ONE →</Text>
          </Pressable>
        )}

        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'grading') {
    return (
      <View style={[styles.center, { flex: 1, gap: 14, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>CHOP IS MARKING…</Text>
      </View>
    );
  }

  if (phase === 'solve') {
    const skill = sess.skills[sess.skillIdx];
    const prob = skill.practice[sess.pIdx];
    const canSubmit = sess.work.split('\n').some((l) => l.trim().length > 0);
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.phaseRow}>
          <Pressable onPress={backToSkills} style={[styles.smallBtn, { borderColor: colors.dark }]}>
            <Text style={[styles.smallBtnText, { color: colors.dark }]}>← SKILLS</Text>
          </Pressable>
          <Text style={[styles.miniLabel, { color: colors.muted }]}>
            PROBLEM {sess.pIdx + 1} OF {skill.practice.length}
          </Text>
          <View style={[styles.phaseBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.phaseBadgeText}>YOU DO</Text>
          </View>
        </View>

        <View style={[styles.card, { borderColor: colors.dark }]}>
          <Text style={[styles.miniLabel, { color: colors.muted }]}>{skill.skill.toUpperCase()}</Text>
          <Text style={[styles.problem, { color: colors.dark }]}>{prob.problem}</Text>
          {prob.figure && <Figure fig={prob.figure} />}
        </View>

        <Text style={[styles.hint, { color: colors.subtle }]}>
          Write one step per line. Press submit when done.
        </Text>

        <TextInput
          style={[styles.workInput, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
          value={sess.work}
          onChangeText={(t) => update({ work: t, gradeError: false })}
          multiline
          placeholder={'Step 1\nStep 2\nStep 3…'}
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
        />

        {!sess.showHint && prob.hint ? (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ showHint: true }); }}
            style={[styles.hintBtn, { borderColor: colors.yellow }]}>
            <Feather name="life-buoy" size={14} color={colors.dark} />
            <Text style={[styles.hintBtnText, { color: colors.dark }]}>STUCK? GET A HINT</Text>
          </Pressable>
        ) : sess.showHint && prob.hint ? (
          <View style={[styles.hintCard, { borderColor: colors.yellow, backgroundColor: '#FFF3DE' }]}>
            <Text style={[styles.miniLabel, { color: colors.dark }]}>💡 HINT</Text>
            <Text style={[styles.hintText, { color: colors.dark }]}>{prob.hint}</Text>
          </View>
        ) : null}

        {sess.gradeError && (
          <Text style={[styles.errorNote, { color: colors.red }]}>
            Couldn't check that. Check your connection and try again.
          </Text>
        )}

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          style={[styles.btn, { backgroundColor: canSubmit ? colors.primary : colors.secondary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: canSubmit ? '#fff' : colors.muted }]}>SUBMIT WORKING</Text>
        </Pressable>

        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'marked' && sess.result) {
    const r = sess.result;
    const correct = r.errLine == null && r.reached;
    const skill = sess.skills[sess.skillIdx];
    const prob = skill.practice[sess.pIdx];
    const isLastProblem = sess.pIdx + 1 >= skill.practice.length;
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: correct ? colors.green : colors.red }]}>
          <Text style={[styles.resultIcon, { color: correct ? colors.green : colors.red }]}>
            {correct ? '✓ CORRECT' : `✗ ERROR ON LINE ${r.errLine ?? '?'}`}
          </Text>
          {r.errorType ? (
            <View style={[styles.errorTypeBadge, { backgroundColor: colors.redLight, borderColor: colors.red }]}>
              <Text style={[styles.errorTypeText, { color: colors.red }]}>{r.errorType.toUpperCase()}</Text>
            </View>
          ) : null}
          <Text style={[styles.body, { color: colors.dark }]}>{r.explanation}</Text>
        </View>

        {r.correctLine ? (
          <View style={[styles.correctCard, { borderColor: colors.green, backgroundColor: colors.greenLight }]}>
            <Text style={[styles.miniLabel, { color: colors.green }]}>LINE {r.errLine} SHOULD SAY</Text>
            <Text style={[styles.stepMath, { color: colors.dark }]}>{r.correctLine}</Text>
          </View>
        ) : null}

        <View style={[styles.workReview, { borderColor: colors.secondary }]}>
          <Text style={[styles.miniLabel, { color: colors.muted }]}>YOUR WORKING</Text>
          {r.lines.map((line, i) => {
            const lineNum = i + 1;
            const isError = r.errLine != null && lineNum === r.errLine;
            const isPast = r.errLine != null && lineNum > r.errLine;
            return (
              <View key={i} style={[styles.reviewLine, isError && { backgroundColor: colors.redLight }]}>
                <Text style={[styles.reviewLineNum, { color: isError ? colors.red : colors.muted }]}>
                  {lineNum}.
                </Text>
                <Text style={[styles.reviewLineText, { color: isPast ? colors.muted : colors.dark, textDecorationLine: isPast ? 'line-through' : 'none' }]}>
                  {line}
                </Text>
                {isError && <Feather name="x" size={14} color={colors.red} />}
                {!isError && !isPast && <Feather name="check" size={14} color={colors.green} />}
              </View>
            );
          })}
        </View>

        {!correct && (
          <Pressable onPress={fixIt} style={[styles.btn, { backgroundColor: colors.yellow, borderColor: colors.dark }]}>
            <Text style={[styles.btnText, { color: colors.dark }]}>FIX MY ERROR →</Text>
          </Pressable>
        )}

        <Pressable
          onPress={nextProblem}
          style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {isLastProblem ? 'SEE MY RESULTS →' : 'NEXT PROBLEM →'}
          </Text>
        </Pressable>

        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // SUMMARY
  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
      <View style={[styles.card, { borderColor: colors.green }]}>
        <Text style={[styles.heading, { color: colors.dark }]}>SESSION COMPLETE!</Text>
        <Text style={[styles.body, { color: colors.subtle }]}>
          Solved {totalSolved} problem{totalSolved !== 1 ? 's' : ''} correctly.
        </Text>
      </View>

      {topErrors.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.red }]}>YOUR ERROR PATTERNS</Text>
          {topErrors.map(([type, count]) => (
            <View key={type} style={[styles.errorPatternCard, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
              <Text style={[styles.errorPatternType, { color: colors.red }]}>{type.toUpperCase()}</Text>
              <Text style={[styles.errorPatternCount, { color: colors.dark }]}>
                {count} time{count !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
          <Text style={[styles.hint, { color: colors.subtle }]}>
            Watch out for these on your next session — they're the moves that trip you up.
          </Text>
        </>
      )}

      {topErrors.length === 0 && (
        <View style={[styles.card, { borderColor: colors.primary }]}>
          <Text style={[styles.body, { color: colors.dark }]}>No errors this session — nice work! 🎉</Text>
        </View>
      )}

      <Pressable onPress={backToSkills} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
        <Text style={[styles.btnText, { color: '#fff' }]}>PRACTISE ANOTHER SKILL →</Text>
      </Pressable>
      <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.secondary, borderColor: colors.dark }]}>
        <Text style={[styles.btnText, { color: colors.dark }]}>BACK TO METHODS</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 14 },
  label: { fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  sectionLabel: { fontWeight: '900', fontSize: 10, letterSpacing: 1.5, marginTop: 4 },
  heading: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  body: { fontSize: 14, fontWeight: '700', lineHeight: 22 },
  hint: { fontSize: 13, fontWeight: '700', lineHeight: 20 },
  miniLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  problem: { fontFamily: 'monospace', fontSize: 16, fontWeight: '700', lineHeight: 26 },
  card: {
    borderWidth: 3, padding: 16, gap: 8,
    boxShadow: '4px 4px 0px #201E2E',
  },
  skillCard: {
    borderWidth: 3, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    boxShadow: '4px 4px 0px #201E2E',
  },
  skillName: { fontWeight: '900', fontSize: 14, lineHeight: 20 },
  skillSub: { fontSize: 11, fontWeight: '700' },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: '#201E2E' },
  phaseBadgeText: { fontWeight: '900', fontSize: 10, letterSpacing: 1.5, color: '#fff' },
  smallBtn: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 4 },
  smallBtnText: { fontWeight: '900', fontSize: 11 },
  stepCard: {
    borderWidth: 2, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  stepNum: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  stepNumText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  stepMath: { fontFamily: 'monospace', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  stepWhy: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  workInput: {
    borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 160,
    lineHeight: 24, fontFamily: 'monospace',
  },
  hintBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start' },
  hintBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  hintCard: { borderWidth: 3, padding: 14, gap: 6 },
  hintText: { fontSize: 13, fontWeight: '700', lineHeight: 20 },
  errorNote: { fontSize: 12, fontWeight: '700' },
  resultIcon: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  errorTypeBadge: { alignSelf: 'flex-start', borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3 },
  errorTypeText: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  correctCard: { borderWidth: 2, padding: 12, gap: 4 },
  workReview: { borderWidth: 2, padding: 12, gap: 6 },
  reviewLine: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  reviewLineNum: { fontSize: 11, fontWeight: '900', width: 20 },
  reviewLineText: { flex: 1, fontFamily: 'monospace', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  errorPatternCard: {
    borderWidth: 2, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  errorPatternType: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  errorPatternCount: { fontWeight: '700', fontSize: 12 },
  btn: {
    borderWidth: 3, padding: 15, alignItems: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
  regenLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 2 },
});

const figStyles = StyleSheet.create({
  tableWrap: { borderWidth: 2, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 6 },
  th: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  td: { fontSize: 13, fontWeight: '600' },
  chartWrap: { gap: 6, paddingVertical: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { width: 48, fontSize: 11, fontWeight: '700' },
  barTrack: { flex: 1, height: 16, overflow: 'hidden' },
  barFill: { height: '100%' },
  barVal: { width: 36, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  diagramWrap: { backgroundColor: '#1a1a2e', padding: 12 },
  diagramArt: { fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});
