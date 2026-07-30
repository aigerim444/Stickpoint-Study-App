import React, { useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { QUIZ_QUESTIONS, SUBJECTS, scoreQuiz } from '@/lib/content';
import colors from '@/constants/colors';

type Step = 'subject' | 'questions';

export default function Quiz() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setQuizResult } = useApp();
  const [step, setStep] = useState<Step>('subject');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUIZ_QUESTIONS.length).fill(null));

  const c = colors.light;

  const pickSubject = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubjectId(id);
    setStep('questions');
  };

  const pickAnswer = (optIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = answers.map((a, i) => (i === qi ? optIdx : a));
    setAnswers(updated);
    setTimeout(() => {
      if (qi < QUIZ_QUESTIONS.length - 1) {
        setQi(qi + 1);
      } else {
        const { scores, topMethods } = scoreQuiz(subjectId, updated);
        setQuizResult(subjectId!, updated, topMethods, scores);
        router.push('/material');
      }
    }, 300);
  };

  const goBack = () => {
    if (step === 'questions' && qi > 0) { setQi(qi - 1); return; }
    if (step === 'questions') { setStep('subject'); return; }
    router.back();
  };

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
            <Text style={[styles.subjectText, { color: c.dark }]}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  const q = QUIZ_QUESTIONS[qi];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.topRow}>
        <Pressable onPress={goBack} style={styles.backRow}>
          <Text style={[styles.backText, { color: c.muted }]}>←</Text>
        </Pressable>
        <Text style={[styles.progress, { color: c.muted }]}>{qi + 1} / {QUIZ_QUESTIONS.length}</Text>
      </View>
      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: c.secondary }]}>
        <View style={[styles.progressFill, { width: `${((qi) / QUIZ_QUESTIONS.length) * 100}%`, backgroundColor: c.primary }]} />
      </View>
      <Text style={[styles.heading, { color: c.dark, marginTop: 8 }]}>{q.q}</Text>
      {q.options.map((opt, i) => (
        <Pressable
          key={i}
          onPress={() => pickAnswer(i)}
          style={({ pressed }) => [
            styles.optCard,
            {
              borderColor: answers[qi] === i ? c.primary : c.dark,
              backgroundColor: answers[qi] === i ? c.purpleLight : c.card,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <View style={[styles.optBullet, { borderColor: answers[qi] === i ? c.primary : c.borderLight, backgroundColor: answers[qi] === i ? c.primary : 'transparent' }]}>
            {answers[qi] === i && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.optText, { color: c.dark }]}>{opt.text}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backRow: { paddingVertical: 4 },
  backText: { fontWeight: '800', fontSize: 13 },
  heading: { fontWeight: '900', fontSize: 20, lineHeight: 30 },
  subheading: { fontWeight: '700', fontSize: 14, lineHeight: 22 },
  progress: { fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  progressBar: { height: 10, borderWidth: 2, borderColor: '#201E2E', overflow: 'hidden' },
  progressFill: { height: '100%' },
  subjectCard: {
    borderWidth: 3, padding: 16,
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
});
