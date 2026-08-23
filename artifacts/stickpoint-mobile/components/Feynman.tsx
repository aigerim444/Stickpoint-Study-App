import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { FeynmanGradeResult, feynmanConcepts, gradeFeynman } from '@/lib/api';
import { Card } from '@/lib/content';

interface Props {
  cards: Card[];
  notes: string;
  name: string;
  age: number | null;
  onComplete: (hardCards: Card[]) => void;
  onBack: () => void;
}

interface Concept {
  concept: string;
  definition: string;
}

type Phase = 'loading' | 'intro' | 'write' | 'grading' | 'gap' | 'result';

/**
 * Feynman Technique with the full close-the-loop flow from the web app:
 * explain from memory → see the gap (never the answer) → rewrite → see the
 * score climb. Concepts are extracted server-side; flashcards are the
 * offline fallback.
 */
export default function Feynman({ cards, notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [items, setItems] = useState<Concept[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [pass, setPass] = useState<1 | 2>(1);
  const [text, setText] = useState('');
  const [firstText, setFirstText] = useState('');
  const [firstScore, setFirstScore] = useState<number | null>(null);
  const [result, setResult] = useState<FeynmanGradeResult | null>(null);
  const [hardCards, setHardCards] = useState<Card[]>([]);
  const [loopsClosed, setLoopsClosed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    feynmanConcepts(notes, { name, age }).then((its) => {
      if (its && its.length) setItems(its);
      else setItems(cards.slice(0, 6).map((c) => ({ concept: c.question, definition: c.answer })));
      setPhase('intro');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = items[idx];

  const startWriting = useCallback(() => {
    setText('');
    setPhase('write');
  }, []);

  const submit = useCallback(async () => {
    if (text.trim().length < 10 || !current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const res = await gradeFeynman(current.concept, current.definition, text, name, age, {
      material: notes,
      secondPass: pass === 2,
      firstText: pass === 2 ? firstText : undefined,
    });
    if (!res) {
      setPhase('write');
      return;
    }
    setResult(res);
    if (pass === 1) {
      setFirstScore(res.score);
      setFirstText(text);
      // A perfect first pass has no gap to close — straight to the result.
      setPhase(res.score >= 5 ? 'result' : 'gap');
    } else {
      if (firstScore != null && res.score > firstScore) setLoopsClosed((n) => n + 1);
      setPhase('result');
    }
  }, [text, current, name, age, notes, pass, firstText, firstScore]);

  const rewrite = useCallback(() => {
    setPass(2);
    setText('');
    setPhase('write');
  }, []);

  const nextConcept = useCallback(() => {
    if (!result || !current) return;
    const newHard =
      result.score <= 2
        ? [...hardCards, { question: 'Explain in your own words: ' + current.concept, answer: result.simpler, methodTag: 'feynman' }]
        : hardCards;
    if (idx < items.length - 1) {
      setHardCards(newHard);
      setIdx(idx + 1);
      setPass(1);
      setPhase('intro');
      setText('');
      setFirstText('');
      setFirstScore(null);
      setResult(null);
    } else {
      setDone(true);
      onComplete(newHard);
    }
  }, [result, current, hardCards, idx, items.length, onComplete]);

  if (phase === 'loading' || phase === 'grading') {
    return (
      <View style={[styles.center, { flex: 1, gap: 16, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>
          {phase === 'loading' ? 'PICKING YOUR CONCEPTS…' : 'CHOP IS CHECKING…'}
        </Text>
      </View>
    );
  }

  if (done) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.green }]}>
          <Text style={[styles.heading, { color: colors.dark }]}>SESSION COMPLETE!</Text>
          <Text style={[styles.body, { color: colors.subtle }]}>
            You worked through {items.length} concepts
            {loopsClosed > 0 ? ` and closed ${loopsClosed} understanding gap${loopsClosed > 1 ? 's' : ''}` : ''}.
          </Text>
        </View>
        <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>BACK TO METHODS</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'gap' && result && current) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.yellow }]}>
          <Text style={[styles.scoreLine, { color: colors.yellow }]}>{result.score}/5</Text>
          <Text style={[styles.feedback, { color: colors.dark }]}>
            First try. Close the gap and grade again — that's where the learning happens.
          </Text>
        </View>
        {!!result.gotRight && (
          <View style={[styles.infoCard, { borderColor: colors.green, backgroundColor: colors.greenLight }]}>
            <Text style={[styles.infoLabel, { color: colors.green }]}>WHAT YOU GOT RIGHT</Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{result.gotRight}</Text>
          </View>
        )}
        {!!result.gap && (
          <View style={[styles.infoCard, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
            <Text style={[styles.infoLabel, { color: colors.red }]}>THE GAP</Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{result.gap}</Text>
          </View>
        )}
        {result.jargon.length > 0 && (
          <View style={[styles.infoCard, { borderColor: colors.dark }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>JARGON DETECTOR</Text>
            {result.jargon.map((j, i) => (
              <Text key={i} style={[styles.infoBody, { color: colors.dark }]}>
                "{j.term}" → try "{j.plain}"
              </Text>
            ))}
          </View>
        )}
        <Pressable onPress={rewrite} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>CLOSE THE GAP — REWRITE IT</Text>
        </Pressable>
        <Pressable onPress={nextConcept} style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: colors.dark }]}>
            {idx < items.length - 1 ? 'SKIP TO NEXT CONCEPT' : 'FINISH SESSION'}
          </Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'result' && result) {
    const scoreColor = result.score >= 4 ? colors.green : result.score >= 3 ? colors.yellow : colors.red;
    const improved = pass === 2 && firstScore != null && result.score > firstScore;
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreLine, { color: scoreColor }]}>
            {improved ? `${firstScore} → ${result.score}` : `${result.score}/5`}
          </Text>
          <Text style={[styles.feedback, { color: colors.dark }]}>
            {improved ? '🎉 Loop closed — your rewrite beat your first try.' : result.feedback}
          </Text>
        </View>
        {!!result.gotRight && (
          <View style={[styles.infoCard, { borderColor: colors.green, backgroundColor: colors.greenLight }]}>
            <Text style={[styles.infoLabel, { color: colors.green }]}>WHAT YOU GOT RIGHT</Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{result.gotRight}</Text>
          </View>
        )}
        {result.score < 5 && !!result.gap && (
          <View style={[styles.infoCard, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
            <Text style={[styles.infoLabel, { color: colors.red }]}>STILL MISSING</Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{result.gap}</Text>
          </View>
        )}
        <View style={[styles.infoCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>SIMPLER VERSION</Text>
          <Text style={[styles.infoBody, { color: colors.dark }]}>{result.simpler}</Text>
        </View>
        <Pressable onPress={nextConcept} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {idx < items.length - 1 ? 'NEXT CONCEPT →' : 'FINISH SESSION'}
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
          <Text style={[styles.conceptLabel, { color: colors.primary }]}>
            {pass === 2 ? 'SECOND TRY — CLOSE THE GAP' : 'EXPLAIN THIS CONCEPT'}
          </Text>
          <Text style={[styles.conceptName, { color: colors.dark }]}>{current?.concept}</Text>
        </View>
        {pass === 2 && !!result?.gap && (
          <View style={[styles.infoCard, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
            <Text style={[styles.infoLabel, { color: colors.red }]}>YOUR GAP</Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{result.gap}</Text>
          </View>
        )}
        <Text style={[styles.hint, { color: colors.subtle }]}>
          Explain it as if you're teaching a 10-year-old. No jargon allowed!
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
          value={text}
          onChangeText={setText}
          multiline
          placeholder={pass === 2 ? 'Rewrite it — this time cover the gap...' : 'Explain it simply...'}
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
      <Text style={[styles.progress, { color: colors.muted }]}>CONCEPT {idx + 1} OF {items.length}</Text>
      <View style={[styles.card, { borderColor: colors.dark }]}>
        <Text style={[styles.topicLabel, { color: colors.primary }]}>YOUR CONCEPT</Text>
        <Text style={[styles.conceptName2, { color: colors.dark }]}>{current?.concept}</Text>
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
    boxShadow: '4px 4px 0px #201E2E',
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
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
});
