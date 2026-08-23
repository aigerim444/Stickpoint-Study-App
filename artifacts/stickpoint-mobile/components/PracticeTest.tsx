import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { buildMCQ, Card } from '@/lib/content';
import { PTQuestion, generatePracticeTest, gradePracticeTestSA } from '@/lib/api';

interface Props {
  cards: Card[];
  notes: string;
  name: string;
  age: number | null;
  onComplete: (missedCards: Card[], score: number, total: number) => void;
  onBack: () => void;
}

type Phase = 'loading' | 'start' | 'answering' | 'grading' | 'review';
type Verdict = 'correct' | 'partially_correct' | 'incorrect';

interface ResultRow {
  question: string;
  type: PTQuestion['type'];
  yours: string;
  correctDisplay: string;
  verdict: Verdict;
  explanation: string;
}

const TEST_MINUTES = 10;

/**
 * Practice Testing — exam-like conditions, ported from the web app: a
 * server-generated mix of multiple choice, true/false, and short answer,
 * timed, no feedback until the end. Short answers are AI-graded leniently
 * on phrasing, strictly on facts; missed questions become drill cards.
 * Falls back to locally built MCQs if generation is unavailable.
 */
export default function PracticeTest({ cards, notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [questions, setQuestions] = useState<PTQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saText, setSaText] = useState('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TEST_MINUTES * 60);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    generatePracticeTest(notes, { name, age }).then((qs) => {
      if (qs && qs.length) {
        setQuestions(qs);
      } else {
        // Offline fallback: multiple choice built from the flashcards.
        setQuestions(
          buildMCQ(cards).map((q) => ({
            question: q.question,
            type: 'multiple_choice' as const,
            options: q.options,
            correctAnswer: 'ABCD'[q.options.indexOf(q.answer)] || 'A',
          })),
        );
      }
      setPhase('start');
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(
    async (finalAnswers: Record<number, string>, ranOut: boolean) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('grading');
      setTimedOut(ranOut);

      const rows: ResultRow[] = questions.map((q, i) => {
        const given = finalAnswers[i];
        const yours = given == null || given === '' ? '- (no answer)' : String(given);
        let correctDisplay = String(q.correctAnswer);
        let verdict: Verdict = 'incorrect';
        let explanation = '';
        if (q.type === 'multiple_choice') {
          const letter = String(q.correctAnswer).trim().toUpperCase().charAt(0);
          const cIdx = 'ABCD'.indexOf(letter);
          correctDisplay = letter + '. ' + (q.options?.[cIdx >= 0 ? cIdx : 0] || '');
          if (given != null && String(given).charAt(0) === letter) verdict = 'correct';
        } else if (q.type === 'true_or_false') {
          if (given != null && String(given).toLowerCase() === correctDisplay.toLowerCase()) verdict = 'correct';
        } else if (given && String(given).trim()) {
          verdict = 'incorrect'; // graded below
        }
        if (given == null && ranOut) explanation = 'Ran out of time before answering.';
        return { question: q.question, type: q.type, yours, correctDisplay, verdict, explanation };
      });

      // Grade short answers one by one (server batches internally per call).
      await Promise.all(
        rows.map(async (r, i) => {
          if (r.type !== 'short_answer' || r.yours === '- (no answer)') return;
          const g = await gradePracticeTestSA(r.question, r.correctDisplay, r.yours, name, age);
          if (g) {
            rows[i].verdict = g.correct ? 'correct' : 'incorrect';
            rows[i].explanation = g.explanation;
          }
        }),
      );

      setResults([...rows]);
      setPhase('review');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [questions, name, age],
  );

  const startTest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('answering');
    setSecondsLeft(TEST_MINUTES * 60);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          finish(answersRef.current, true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [finish]);

  const answer = useCallback(
    (value: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = { ...answersRef.current, [qi]: value };
      setAnswers(next);
      setSaText('');
      if (qi < questions.length - 1) {
        setTimeout(() => setQi((i) => i + 1), 250);
      } else {
        finish(next, false);
      }
    },
    [qi, questions.length, finish],
  );

  const score = useMemo(
    () => (results ? results.filter((r) => r.verdict === 'correct').length : 0),
    [results],
  );

  const missedCards = useMemo(() => {
    if (!results) return [];
    return results
      .filter((r) => r.verdict !== 'correct')
      .map((r) => ({
        question: r.question,
        answer: r.correctDisplay.replace(/^[A-D]\.\s*/, ''),
        methodTag: 'practice_testing',
      }));
  }, [results]);

  if (phase === 'loading' || phase === 'grading') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>
          {phase === 'loading' ? 'WRITING YOUR TEST…' : 'GRADING YOUR ANSWERS…'}
        </Text>
      </View>
    );
  }

  if (phase === 'start') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.questionCard, { borderColor: colors.dark }]}>
          <Text style={[styles.qText, { color: colors.dark }]}>
            {questions.length} questions · {TEST_MINUTES} minutes
          </Text>
          <Text style={[styles.startBody, { color: colors.subtle }]}>
            Real test conditions: notes stay closed, the clock counts down, one question at a
            time, no feedback until the end. Missed questions go to your drill deck.
          </Text>
        </View>
        <Pressable onPress={startTest} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>START THE TEST</Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'review' && results) {
    const pct = Math.round((score / results.length) * 100);
    const scoreColor = pct >= 70 ? colors.green : pct >= 50 ? colors.yellow : colors.red;
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.scoreCard, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}/{results.length}</Text>
          <Text style={[styles.scorePct, { color: colors.dark }]}>{pct}%</Text>
          {timedOut && <Text style={[styles.timeoutNote, { color: colors.red }]}>⏱ TIME RAN OUT</Text>}
        </View>
        {results.map((r, i) => {
          const correct = r.verdict === 'correct';
          return (
            <View
              key={i}
              style={[
                styles.reviewCard,
                {
                  borderColor: correct ? colors.green : colors.red,
                  backgroundColor: correct ? colors.greenLight : colors.redLight,
                },
              ]}>
              <Text style={[styles.reviewQ, { color: colors.dark }]}>{r.question}</Text>
              {!correct && <Text style={[styles.reviewWrong, { color: colors.red }]}>✗ {r.yours}</Text>}
              <Text style={[styles.reviewRight, { color: correct ? colors.green : colors.dark }]}>
                ✓ {r.correctDisplay}
              </Text>
              {!!r.explanation && (
                <Text style={[styles.reviewExplain, { color: colors.subtle }]}>{r.explanation}</Text>
              )}
            </View>
          );
        })}
        <Pressable
          onPress={() => onComplete(missedCards, score, results.length)}
          style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>DONE</Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const q = questions[qi];
  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const options =
    q.type === 'multiple_choice'
      ? (q.options || []).map((opt, i) => ({ value: String.fromCharCode(65 + i), label: opt }))
      : q.type === 'true_or_false'
        ? [
            { value: 'True', label: 'True' },
            { value: 'False', label: 'False' },
          ]
        : null;

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.progressLabel, { color: colors.muted }]}>Q {qi + 1} / {questions.length}</Text>
          <Text style={[styles.timer, { color: secondsLeft <= 60 ? colors.red : colors.dark }]}>
            {mins}:{secs}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
          <View style={[styles.progressFill, { width: `${(qi / questions.length) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>
      <View style={[styles.questionCard, { borderColor: colors.dark }]}>
        <Text style={[styles.qType, { color: colors.muted }]}>
          {q.type === 'multiple_choice' ? 'MULTIPLE CHOICE' : q.type === 'true_or_false' ? 'TRUE OR FALSE' : 'SHORT ANSWER'}
        </Text>
        <Text style={[styles.qText, { color: colors.dark }]}>{q.question}</Text>
      </View>
      {options ? (
        options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => answer(opt.value)}
            style={[styles.option, { borderColor: colors.dark, backgroundColor: colors.card }]}>
            {q.type === 'multiple_choice' && (
              <Text style={[styles.optionLabel, { color: colors.dark }]}>{opt.value}.</Text>
            )}
            <Text style={[styles.optionText, { color: colors.dark }]}>{opt.label}</Text>
          </Pressable>
        ))
      ) : (
        <>
          <TextInput
            style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
            value={saText}
            onChangeText={setSaText}
            multiline
            placeholder="Type your answer..."
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />
          <Pressable
            onPress={() => saText.trim() && answer(saText.trim())}
            disabled={!saText.trim()}
            style={[styles.btn, { backgroundColor: saText.trim() ? colors.primary : colors.secondary, borderColor: colors.dark }]}>
            <Text style={[styles.btnText, { color: saText.trim() ? '#fff' : colors.muted }]}>SUBMIT ANSWER</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  container: { padding: 20, gap: 12 },
  label: { fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  header: { gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  timer: { fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  progressBar: { height: 10, borderWidth: 2, borderColor: '#201E2E', overflow: 'hidden' },
  progressFill: { height: '100%' },
  questionCard: { borderWidth: 3, padding: 20, gap: 6,
    boxShadow: '4px 4px 0px #201E2E',
  },
  qType: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  qText: { fontSize: 17, fontWeight: '800', lineHeight: 26 },
  startBody: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  option: { borderWidth: 3, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  optionLabel: { fontWeight: '900', fontSize: 15, width: 22 },
  optionText: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 22 },
  input: { borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 100, lineHeight: 24 },
  scoreCard: {
    borderWidth: 3, padding: 24, alignItems: 'center', gap: 2,
    boxShadow: '5px 5px 0px #201E2E',
  },
  scoreNum: { fontWeight: '900', fontSize: 36 },
  scorePct: { fontWeight: '900', fontSize: 16 },
  timeoutNote: { fontWeight: '900', fontSize: 11, letterSpacing: 1, marginTop: 6 },
  reviewCard: { borderWidth: 2, padding: 12, gap: 4 },
  reviewQ: { fontWeight: '800', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  reviewWrong: { fontWeight: '700', fontSize: 12, lineHeight: 18 },
  reviewRight: { fontWeight: '800', fontSize: 12, lineHeight: 18 },
  reviewExplain: { fontWeight: '600', fontSize: 12, lineHeight: 18, marginTop: 2 },
  btn: {
    borderWidth: 3, padding: 15, alignItems: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
});
