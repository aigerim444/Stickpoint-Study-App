import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { buildMCQ } from '@/lib/content';
import { Card } from '@/lib/content';

interface Props {
  cards: Card[];
  onComplete: (missedCards: Card[], score: number, total: number) => void;
  onBack: () => void;
}

type Phase = 'answering' | 'review';

export default function PracticeTest({ cards, onComplete, onBack }: Props) {
  const colors = useColors();
  const questions = useMemo(() => buildMCQ(cards), [cards]);
  const [qi, setQi] = useState(0);
  const [selections, setSelections] = useState<(string | null)[]>(() => new Array(questions.length).fill(null));
  const [phase, setPhase] = useState<Phase>('answering');

  const select = useCallback((option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelections((prev) => prev.map((s, i) => (i === qi ? option : s)));
    setTimeout(() => {
      if (qi < questions.length - 1) setQi(qi + 1);
      else setPhase('review');
    }, 350);
  }, [qi, questions.length]);

  const score = useMemo(() => {
    return selections.reduce((acc, sel, i) => acc + (sel === questions[i]?.answer ? 1 : 0), 0);
  }, [selections, questions]);

  const missedCards = useMemo(() => {
    return selections
      .map((sel, i) => ({ sel, q: questions[i] }))
      .filter(({ sel, q }) => sel !== q?.answer)
      .map(({ q }) => cards.find((c) => c.question === q?.question))
      .filter(Boolean) as Card[];
  }, [selections, questions, cards]);

  const pct = Math.round((score / questions.length) * 100);
  const scoreColor = pct >= 70 ? colors.green : pct >= 50 ? colors.yellow : colors.red;

  if (phase === 'review') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.scoreCard, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}/{questions.length}</Text>
          <Text style={[styles.scorePct, { color: colors.dark }]}>{pct}%</Text>
        </View>
        {questions.map((q, i) => {
          const correct = selections[i] === q.answer;
          return (
            <View key={i} style={[styles.reviewCard, { borderColor: correct ? colors.green : colors.red, backgroundColor: correct ? colors.greenLight : colors.redLight }]}>
              <Text style={[styles.reviewQ, { color: colors.dark }]}>{q.question}</Text>
              {!correct && <Text style={[styles.reviewWrong, { color: colors.red }]}>✗ {selections[i] || '(no answer)'}</Text>}
              <Text style={[styles.reviewRight, { color: correct ? colors.green : colors.dark }]}>✓ {q.answer}</Text>
            </View>
          );
        })}
        <Pressable
          onPress={() => { onComplete(missedCards, score, questions.length); }}
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
  const sel = selections[qi];

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
      <View style={styles.header}>
        <Text style={[styles.progressLabel, { color: colors.muted }]}>Q {qi + 1} / {questions.length}</Text>
        <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
          <View style={[styles.progressFill, { width: `${(qi / questions.length) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>
      <View style={[styles.questionCard, { borderColor: colors.dark }]}>
        <Text style={[styles.qText, { color: colors.dark }]}>{q.question}</Text>
      </View>
      {q.options.map((opt, i) => (
        <Pressable
          key={i}
          onPress={() => select(opt)}
          style={[
            styles.option,
            {
              borderColor: sel === opt ? colors.primary : colors.dark,
              backgroundColor: sel === opt ? colors.purpleLight : colors.card,
            },
          ]}>
          <Text style={[styles.optionLabel, { color: colors.dark }]}>{String.fromCharCode(65 + i)}.</Text>
          <Text style={[styles.optionText, { color: colors.dark }]}>{opt}</Text>
        </Pressable>
      ))}
      <Pressable onPress={onBack} style={styles.backLink}>
        <Feather name="arrow-left" size={14} color={colors.muted} />
        <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  header: { gap: 8 },
  progressLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  progressBar: { height: 10, borderWidth: 2, borderColor: '#201E2E', overflow: 'hidden' },
  progressFill: { height: '100%' },
  questionCard: { borderWidth: 3, padding: 20,
    boxShadow: '4px 4px 0px #201E2E',
  },
  qText: { fontSize: 17, fontWeight: '800', lineHeight: 26 },
  option: { borderWidth: 3, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  optionLabel: { fontWeight: '900', fontSize: 15, width: 22 },
  optionText: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 22 },
  scoreCard: {
    borderWidth: 3, padding: 24, alignItems: 'center', gap: 2,
    boxShadow: '5px 5px 0px #201E2E',
  },
  scoreNum: { fontWeight: '900', fontSize: 36 },
  scorePct: { fontWeight: '900', fontSize: 16 },
  reviewCard: { borderWidth: 2, padding: 12, gap: 4 },
  reviewQ: { fontWeight: '800', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  reviewWrong: { fontWeight: '700', fontSize: 12, lineHeight: 18 },
  reviewRight: { fontWeight: '800', fontSize: 12, lineHeight: 18 },
  btn: {
    borderWidth: 3, padding: 15, alignItems: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
});
