import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { gradeFeynman } from '@/lib/api';
import { Card } from '@/lib/content';

interface Props {
  cards: Card[];
  name: string;
  age: number | null;
  onComplete: (hardCards: Card[]) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'write' | 'grading' | 'result';

export default function Feynman({ cards, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [cardIdx, setCardIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ score: number; feedback: string; simpler: string; gotRight: string; gap: string | null } | null>(null);
  const [hardCards, setHardCards] = useState<Card[]>([]);
  const [done, setDone] = useState(false);

  const current = cards[cardIdx];

  const startWriting = useCallback(() => {
    setText('');
    setPhase('write');
  }, []);

  const submit = useCallback(async () => {
    if (!text.trim() || !current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const res = await gradeFeynman(current.question, current.answer, text, name, age);
    setResult(res);
    setPhase('result');
  }, [text, current, name, age]);

  const nextConcept = useCallback(() => {
    if (!result || !current) return;
    const newHard = result.score <= 2 ? [...hardCards, current] : hardCards;
    if (cardIdx < cards.length - 1) {
      setHardCards(newHard);
      setCardIdx(cardIdx + 1);
      setPhase('intro');
      setText('');
      setResult(null);
    } else {
      setDone(true);
      onComplete(newHard);
    }
  }, [result, current, hardCards, cardIdx, cards.length, onComplete]);

  if (done) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.green }]}>
          <Text style={[styles.heading, { color: colors.dark }]}>SESSION COMPLETE!</Text>
          <Text style={[styles.body, { color: colors.subtle }]}>
            You explained {cards.length - hardCards.length} of {cards.length} concepts clearly.
          </Text>
        </View>
        <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>BACK TO METHODS</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'grading') {
    return (
      <View style={[styles.center, { flex: 1, gap: 16, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>CHOP IS CHECKING…</Text>
      </View>
    );
  }

  if (phase === 'result' && result) {
    const scoreColor = result.score >= 4 ? colors.green : result.score >= 3 ? colors.yellow : colors.red;
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreLine, { color: scoreColor }]}>{result.score}/5</Text>
          <Text style={[styles.feedback, { color: colors.dark }]}>{result.feedback}</Text>
        </View>
        <View style={[styles.infoCard, { borderColor: colors.green, backgroundColor: colors.greenLight }]}>
          <Text style={[styles.infoLabel, { color: colors.green }]}>WHAT YOU GOT RIGHT</Text>
          <Text style={[styles.infoBody, { color: colors.dark }]}>{result.gotRight}</Text>
        </View>
        {result.gap && (
          <View style={[styles.infoCard, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
            <Text style={[styles.infoLabel, { color: colors.red }]}>THE GAP</Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{result.gap}</Text>
          </View>
        )}
        <View style={[styles.infoCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>SIMPLER VERSION</Text>
          <Text style={[styles.infoBody, { color: colors.dark }]}>{result.simpler}</Text>
        </View>
        <Pressable onPress={nextConcept} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {cardIdx < cards.length - 1 ? 'NEXT CONCEPT →' : 'FINISH SESSION'}
          </Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'write') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.conceptBadge, { borderColor: colors.dark, backgroundColor: colors.purpleLight }]}>
          <Text style={[styles.conceptLabel, { color: colors.primary }]}>EXPLAIN THIS CONCEPT</Text>
          <Text style={[styles.conceptName, { color: colors.dark }]}>{current?.question}</Text>
        </View>
        <Text style={[styles.hint, { color: colors.subtle }]}>
          Explain it as if you're teaching a 10-year-old. No jargon allowed!
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Explain it simply..."
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          autoFocus
        />
        <View style={styles.row}>
          <Pressable
            onPress={submit}
            disabled={text.trim().length < 10}
            style={[styles.btn, { flex: 1, backgroundColor: text.trim().length >= 10 ? colors.primary : colors.secondary, borderColor: colors.dark }]}>
            <Text style={[styles.btnText, { color: text.trim().length >= 10 ? '#fff' : colors.muted }]}>GRADE IT</Text>
          </Pressable>
        </View>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Intro phase
  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
      <Text style={[styles.progress, { color: colors.muted }]}>CONCEPT {cardIdx + 1} OF {cards.length}</Text>
      <View style={[styles.card, { borderColor: colors.dark }]}>
        <Text style={[styles.topicLabel, { color: colors.primary }]}>YOUR CONCEPT</Text>
        <Text style={[styles.conceptName2, { color: colors.dark }]}>{current?.question}</Text>
      </View>
      <Text style={[styles.body, { color: colors.subtle }]}>
        Close your notes. Explain this concept in the simplest words possible — like you're teaching it to someone who's never heard of it.
      </Text>
      <Pressable onPress={startWriting} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
        <Text style={[styles.btnText, { color: '#fff' }]}>START WRITING</Text>
      </Pressable>
      <Pressable onPress={onBack} style={styles.backLink}>
        <Feather name="arrow-left" size={14} color={colors.muted} />
        <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 14 },
  progress: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  label: { fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  card: {
    borderWidth: 3, padding: 20, gap: 8,
    ...Platform.select({ ios: { shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }, android: { elevation: 3 } }),
  },
  conceptBadge: { borderWidth: 3, padding: 16, gap: 8 },
  conceptLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  conceptName: { fontSize: 20, fontWeight: '900', lineHeight: 28 },
  conceptName2: { fontSize: 22, fontWeight: '900', lineHeight: 30, marginTop: 4 },
  topicLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heading: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  body: { fontSize: 14, fontWeight: '700', lineHeight: 22 },
  hint: { fontSize: 13, fontWeight: '700', lineHeight: 20 },
  input: { borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 160, lineHeight: 24 },
  scoreLine: { fontSize: 48, fontWeight: '900', textAlign: 'center' },
  feedback: { fontSize: 14, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  infoCard: { borderWidth: 2, padding: 12, gap: 4 },
  infoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  infoBody: { fontSize: 13, fontWeight: '700', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    borderWidth: 3, padding: 15, alignItems: 'center',
    ...Platform.select({ ios: { shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }, android: { elevation: 3 } }),
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
});
