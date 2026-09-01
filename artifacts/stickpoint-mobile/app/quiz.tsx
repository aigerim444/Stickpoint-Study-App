import React, { useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { QUIZ_QUESTIONS, SUBJECTS, getMethodById, scoreQuiz } from '@/lib/content';
import ChopCharacter from '@/components/ChopCharacter';
import PixelText from '@/components/PixelText';
import colors from '@/constants/colors';

type Step = 'subject' | 'questions' | 'results';
type Answer = number | number[] | null;

const RANK_COLORS = ['#453F8C', '#FF6B4A', '#2DD4A7'];
const RANK_LABELS = ['#1', '#2', '#3'];

/**
 * The diagnostic quiz, matching the original prototype's flow: no
 * auto-advance (explicit GO BACK / NEXT), torn students can pick two
 * answers (each counts half — the scoring in core splits the weight), and
 * results are shown immediately with the top-3 method cards.
 */
export default function Quiz() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setQuizResult } = useApp();
  const [step, setStep] = useState<Step>('subject');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(new Array(QUIZ_QUESTIONS.length).fill(null));
  const [topMethods, setTopMethods] = useState<string[]>([]);

  const c = colors.light;

  // Tap selects, NEXT advances — auto-advancing stole the chance to
  // change your mind (same fix the quiz questions already got).
  const pickSubject = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubjectId(id);
  };

  // Tap toggles; up to two picks; a third replaces the older one.
  // (Ported verbatim from the prototype's pickQuizOption.)
  const toggleOption = (optIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((prev) => {
      const cur = prev[qi];
      const list = cur == null ? [] : Array.isArray(cur) ? [...cur] : [cur];
      const at = list.indexOf(optIdx);
      let next: number[];
      if (at >= 0) next = list.filter((i) => i !== optIdx);
      else if (list.length < 2) next = [...list, optIdx];
      else next = [list[1], optIdx];
      const value: Answer = next.length === 0 ? null : next.length === 1 ? next[0] : next;
      return prev.map((a, i) => (i === qi ? value : a));
    });
  };

  const quizNext = () => {
    if (answers[qi] == null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (qi < QUIZ_QUESTIONS.length - 1) {
      setQi(qi + 1);
    } else {
      const { scores, topMethods: top } = scoreQuiz(subjectId, answers);
      setQuizResult(subjectId!, answers, top, scores);
      setTopMethods(top);
      setStep('results');
    }
  };

  const goBack = () => {
    if (step === 'questions' && qi > 0) { setQi(qi - 1); return; }
    if (step === 'questions') { setStep('subject'); return; }
    if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };

  // ── Results ───────────────────────────────────────────────────────────────
  if (step === 'results') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.resultHeader}>
          <ChopCharacter size={0.8} color={c.dark} animation="celebrate" />
          <View style={[styles.resultBubble, { borderColor: c.dark }]}>
            <Text style={[styles.resultBubbleText, { color: c.dark }]}>
              Nice, {state.name}! Here's what Chop found
            </Text>
          </View>
        </View>
        <PixelText style={styles.resultTitle}>YOUR TOP METHODS</PixelText>
        {topMethods.slice(0, 3).map((id, rank) => {
          const m = getMethodById(id);
          if (!m) return null;
          const color = RANK_COLORS[rank];
          return (
            <View key={id} style={[styles.resultCard, { borderColor: c.dark, boxShadow: `5px 5px 0px ${color}` }]}>
              <View style={styles.resultCardHead}>
                <Text style={[styles.resultCardName, { color: c.dark }]}>
                  {RANK_LABELS[rank]} {m.label}
                </Text>
                <View style={[styles.matchBadge, { backgroundColor: color, borderColor: c.dark }]}>
                  <Text style={styles.matchBadgeText}>MATCH</Text>
                </View>
              </View>
              <Text style={[styles.resultWhy, { color: c.subtle }]}>{m.whyWorks}</Text>
              <Text style={[styles.resultEvidence, { color: c.muted }]}>{m.evidence}</Text>
            </View>
          );
        })}
        <Pressable
          onPress={() => router.replace('/save-progress' as never)}
          style={({ pressed }) => [styles.btn, { backgroundColor: c.accent, borderColor: c.dark, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.btnText}>ADD MY STUDY MATERIAL →</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/save-progress?next=tabs' as never)} style={{ alignSelf: 'center', paddingVertical: 4 }}>
          <Text style={[styles.backText, { color: c.muted }]}>look around first</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Subject ───────────────────────────────────────────────────────────────
  if (step === 'subject') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
        <Pressable onPress={goBack} style={styles.backRow}>
          <Text style={[styles.backText, { color: c.muted }]}>← {state.name}</Text>
        </Pressable>
        <Text style={[styles.heading, { color: c.dark }]}>What are you studying?</Text>
        <Text style={[styles.subheading, { color: c.subtle }]}>Chop will pick the right methods for your subject.</Text>
        {SUBJECTS.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => pickSubject(s.id)}
            style={({ pressed }) => [
              styles.subjectCard,
              { borderColor: c.dark, backgroundColor: subjectId === s.id ? c.purpleLight : c.card, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Text style={[styles.subjectText, { color: c.dark, flex: 1 }]}>{s.label}</Text>
            {subjectId === s.id && <Text style={{ color: c.primary, fontWeight: '900', fontSize: 16 }}>✓</Text>}
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            if (!subjectId) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setStep('questions');
          }}
          disabled={!subjectId}
          style={[styles.navNext, {
            backgroundColor: subjectId ? c.accent : c.secondary,
            borderColor: c.dark,
            marginTop: 8,
          }]}>
          <Text style={[styles.navNextText, { color: subjectId ? '#fff' : c.muted }]}>NEXT →</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Questions ─────────────────────────────────────────────────────────────
  const q = QUIZ_QUESTIONS[qi];
  const raw = answers[qi];
  const picked = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
  const tied = picked.length > 1;
  const answered = picked.length > 0;
  const isLast = qi === QUIZ_QUESTIONS.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: 16 }]}>
        <View style={styles.topRow}>
          <Text style={[styles.progress, { color: c.muted }]}>{qi + 1} / {QUIZ_QUESTIONS.length}</Text>
        </View>
        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: c.secondary }]}>
          <View style={[styles.progressFill, { width: `${((qi + 1) / QUIZ_QUESTIONS.length) * 100}%`, backgroundColor: c.primary }]} />
        </View>
        <Text style={[styles.heading, { color: c.dark, marginTop: 8 }]}>{q.q}</Text>
        <Text style={[styles.tieHint, { color: c.muted }]}>
          {tied
            ? 'Both picked — each counts half. Tap one to unpick it.'
            : 'Torn between two? Pick both — each will count half.'}
        </Text>
        {q.options.map((opt, i) => {
          const sel = picked.includes(i);
          return (
            <Pressable
              key={i}
              onPress={() => toggleOption(i)}
              style={({ pressed }) => [
                styles.optCard,
                {
                  borderColor: sel ? c.primary : c.dark,
                  backgroundColor: sel ? c.purpleLight : c.card,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View style={[styles.optBullet, { borderColor: sel ? c.primary : c.borderLight, backgroundColor: sel ? c.primary : 'transparent' }]}>
                {sel && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.optText, { color: c.dark }]}>{opt.text}</Text>
              {sel && (
                <View style={[styles.pickBadge, { backgroundColor: c.primary, borderColor: c.dark }]}>
                  <Text style={styles.pickBadgeText}>{tied ? 'HALF' : 'PICKED'}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* GO BACK / NEXT — no auto-advance, exactly like the prototype */}
      <View style={[styles.navRow, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.navBack, { borderColor: c.dark, backgroundColor: c.card, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[styles.navBackText, { color: c.dark }]}>← GO BACK</Text>
        </Pressable>
        <Pressable
          onPress={quizNext}
          disabled={!answered}
          style={({ pressed }) => [
            styles.navNext,
            { borderColor: c.dark, backgroundColor: answered ? c.accent : c.secondary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[styles.navNextText, { color: answered ? '#fff' : c.muted }]}>
            {isLast ? 'SEE MY RESULTS →' : 'NEXT →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  backRow: { paddingVertical: 4 },
  backText: { fontWeight: '800', fontSize: 13 },
  heading: { fontWeight: '900', fontSize: 20, lineHeight: 30 },
  subheading: { fontWeight: '700', fontSize: 14, lineHeight: 22 },
  progress: { fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  progressBar: { height: 10, borderWidth: 2, borderColor: '#201E2E', overflow: 'hidden' },
  progressFill: { height: '100%' },
  tieHint: { fontWeight: '700', fontSize: 12, lineHeight: 18 },
  subjectCard: {
    borderWidth: 3, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
    boxShadow: '4px 4px 0px #201E2E',
  },
  subjectText: { fontWeight: '800', fontSize: 15 },
  optCard: {
    borderWidth: 3, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center',
    boxShadow: '3px 3px 0px #201E2E',
  },
  optBullet: { width: 22, height: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontWeight: '900', fontSize: 12 },
  optText: { flex: 1, fontWeight: '700', fontSize: 14, lineHeight: 22 },
  pickBadge: { borderWidth: 2, paddingHorizontal: 6, paddingVertical: 2 },
  pickBadgeText: { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 0.5 },
  navRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  navBack: { flex: 1, borderWidth: 3, padding: 14, alignItems: 'center' },
  navBackText: { fontWeight: '900', fontSize: 13 },
  navNext: {
    flex: 1.4, borderWidth: 3, padding: 14, alignItems: 'center',
    boxShadow: '3px 3px 0px #201E2E',
  },
  navNextText: { fontWeight: '900', fontSize: 13 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultBubble: {
    flex: 1, backgroundColor: '#fff', borderWidth: 3, padding: 12,
    boxShadow: '3px 3px 0px #201E2E',
  },
  resultBubbleText: { fontWeight: '800', fontSize: 13, lineHeight: 19 },
  resultTitle: { fontSize: 14, lineHeight: 24, marginTop: 6 },
  resultCard: { backgroundColor: '#fff', borderWidth: 3, padding: 16, gap: 8 },
  resultCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCardName: { fontWeight: '900', fontSize: 16, flex: 1 },
  matchBadge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3 },
  matchBadgeText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  resultWhy: { fontWeight: '700', fontSize: 13, lineHeight: 20 },
  resultEvidence: { fontWeight: '700', fontSize: 11, lineHeight: 17, fontStyle: 'italic' },
  btn: {
    borderWidth: 3, padding: 15, alignItems: 'center', marginTop: 8,
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
