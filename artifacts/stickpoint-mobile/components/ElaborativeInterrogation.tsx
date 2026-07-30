import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { generateWhyQuestions, gradeElaborative } from '@/lib/api';
import { Card } from '@/lib/content';

interface Props {
  cards: Card[];
  name: string;
  age: number | null;
  onComplete: () => void;
  onBack: () => void;
}

interface WhyQ { fact: string; why: string; }
type Phase = 'loading' | 'write' | 'grading' | 'result' | 'done';

export default function ElaborativeInterrogation({ cards, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [questions, setQuestions] = useState<WhyQ[]>([]);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ correct: boolean; feedback: string; modelAnswer: string } | null>(null);

  useEffect(() => {
    generateWhyQuestions(cards.slice(0, 8), name, age).then((qs) => {
      if (qs && qs.length) { setQuestions(qs); setPhase('write'); }
      else setPhase('done');
    });
  }, []);

  const current = questions[qi];

  const submit = useCallback(async () => {
    if (!text.trim() || !current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const res = await gradeElaborative(current.fact, current.why, text, name, age);
    setResult(res);
    setPhase('result');
  }, [text, current, name, age]);

  const next = useCallback(() => {
    if (qi < questions.length - 1) {
      setQi(qi + 1);
      setPhase('write');
      setText('');
      setResult(null);
    } else {
      setPhase('done');
      onComplete();
    }
  }, [qi, questions.length, onComplete]);

  if (phase === 'loading') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>GENERATING WHY QUESTIONS…</Text>
      </View>
    );
  }

  if (phase === 'grading') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>CHECKING YOUR REASONING…</Text>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.green }]}>
          <Text style={[styles.heading, { color: colors.dark }]}>SESSION COMPLETE!</Text>
          <Text style={[styles.body, { color: colors.subtle }]}>You've thought through {questions.length} why questions.</Text>
        </View>
        <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>BACK TO METHODS</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'result' && result) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: result.correct ? colors.green : colors.red }]}>
          <Text style={[styles.resultIcon, { color: result.correct ? colors.green : colors.red }]}>
            {result.correct ? '✓ CORRECT REASONING' : '✗ NEEDS WORK'}
          </Text>
          <Text style={[styles.body, { color: colors.dark }]}>{result.feedback}</Text>
        </View>
        <View style={[styles.infoCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>MODEL ANSWER</Text>
          <Text style={[styles.infoBody, { color: colors.dark }]}>{result.modelAnswer}</Text>
        </View>
        <Pressable onPress={next} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {qi < questions.length - 1 ? 'NEXT QUESTION →' : 'FINISH SESSION'}
          </Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
      <Text style={[styles.progress, { color: colors.muted }]}>Q {qi + 1} OF {questions.length}</Text>
      <View style={[styles.factCard, { borderColor: colors.dark }]}>
        <Text style={[styles.factLabel, { color: colors.muted }]}>FACT</Text>
        <Text style={[styles.factText, { color: colors.dark }]}>{current?.fact}</Text>
      </View>
      <View style={[styles.whyCard, { borderColor: colors.accent, backgroundColor: '#FFF3DE' }]}>
        <Text style={[styles.whyText, { color: colors.accent }]}>{current?.why}</Text>
      </View>
      <TextInput
        style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Because..."
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
        autoFocus
      />
      <Pressable
        onPress={submit}
        disabled={text.trim().length < 5}
        style={[styles.btn, { backgroundColor: text.trim().length >= 5 ? colors.primary : colors.secondary, borderColor: colors.dark }]}>
        <Text style={[styles.btnText, { color: text.trim().length >= 5 ? '#fff' : colors.muted }]}>SUBMIT ANSWER</Text>
      </Pressable>
      <Pressable onPress={onBack} style={styles.backLink}>
        <Feather name="arrow-left" size={14} color={colors.muted} />
        <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  container: { padding: 20, gap: 14 },
  label: { fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  progress: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  card: { borderWidth: 3, padding: 20, gap: 8,
    boxShadow: '4px 4px 0px #201E2E',
  },
  heading: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  body: { fontSize: 14, fontWeight: '700', lineHeight: 22 },
  factCard: { borderWidth: 3, padding: 16, gap: 6 },
  factLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  factText: { fontSize: 16, fontWeight: '800', lineHeight: 26 },
  whyCard: { borderWidth: 2, padding: 14 },
  whyText: { fontSize: 17, fontWeight: '900', lineHeight: 26 },
  input: { borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 120, lineHeight: 24 },
  resultIcon: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  infoCard: { borderWidth: 2, padding: 12, gap: 4 },
  infoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  infoBody: { fontSize: 13, fontWeight: '700', lineHeight: 20 },
  btn: {
    borderWidth: 3, padding: 15, alignItems: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
});
