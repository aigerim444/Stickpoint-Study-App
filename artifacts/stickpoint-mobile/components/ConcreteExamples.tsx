import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import EtaBar from '@/components/EtaBar';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CEItem, ceGenerate, ceGrade, ceNewExample } from '@/lib/api';
import { Card } from '@/lib/content';

interface Props {
  notes: string;
  name: string;
  age: number | null;
  onComplete: (hardCards: Card[]) => void;
  onBack: () => void;
}

type Phase = 'loading' | 'gen_error' | 'card' | 'grading' | 'feedback' | 'newExample' | 'done';

/**
 * Concrete Examples (dual coding): reveal a vivid real-world example for an
 * abstract concept, then have the student explain the connection back.
 * Ported from the web app's concrete_examples flow.
 */
export default function ConcreteExamples({ notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [items, setItems] = useState<CEItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [revealed, setRevealed] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ correct: boolean; gotRight: string; missed: string; reinforce: string } | null>(null);
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [gradeError, setGradeError] = useState(false);

  const generate = useCallback(() => {
    setPhase('loading');
    ceGenerate(notes, { name, age }).then((its) => {
      if (its && its.length) {
        setItems(its);
        setPhase('card');
      } else {
        // Generation failed — an honest error beats "SESSION COMPLETE! 0 of 0".
        setPhase('gen_error');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, name, age]);
  useEffect(() => { generate(); // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  const current = items[idx];

  const submit = useCallback(async () => {
    if (text.trim().length < 5 || !current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const res = await ceGrade(current, text, { name, age });
    if (!res) {
      setGradeError(true);
      setPhase('card');
      return;
    }
    setGradeError(false);
    setResult(res);
    // Overwrite, not first-write-wins: asking for a different example marks
    // the concept false, and a correct explanation afterwards must count.
    setFlags((f) => ({ ...f, [idx]: res.correct }));
    setPhase('feedback');
  }, [text, current, idx, name, age]);

  const differentExample = useCallback(async () => {
    if (!current) return;
    setFlags((f) => ({ ...f, [idx]: false }));
    setPhase('newExample');
    const example = await ceNewExample(current, { name, age });
    if (!example) {
      setGradeError(true);
      setPhase('card');
      return;
    }
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, example } : it)));
    setGradeError(false);
    setText('');
    setResult(null);
    setRevealed(true);
    setPhase('card');
  }, [current, idx, name, age]);

  const next = useCallback(() => {
    if (idx < items.length - 1) {
      setIdx(idx + 1);
      setPhase('card');
      setRevealed(false);
      setText('');
      setResult(null);
    } else {
      // Concepts the student never connected become drill flashcards.
      const hard: Card[] = items
        .map((it, i) => ({ it, i }))
        .filter((x) => flags[x.i] === false)
        .map((x) => ({
          question: x.it.concept,
          answer: x.it.plainDefinition + ' Example: ' + x.it.example,
          methodTag: 'active_recall',
        }));
      setPhase('done');
      onComplete(hard);
    }
  }, [idx, items, flags, onComplete]);

  if (phase === 'loading' || phase === 'grading' || phase === 'newExample') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>
          {phase === 'loading'
            ? 'FINDING REAL-WORLD EXAMPLES…'
            : phase === 'newExample'
              ? 'INVENTING A FRESH EXAMPLE…'
              : 'CHECKING YOUR CONNECTION…'}
        </Text>
        <EtaBar key={phase} seconds={phase === 'loading' ? 18 : 8} />
      </View>
    );
  }

  if (phase === 'gen_error') {
    return (
      <View style={[styles.center, { flex: 1, gap: 14, backgroundColor: colors.background, padding: 24 }]}>
        <Feather name="cloud-off" size={28} color={colors.muted} />
        <Text style={[styles.label, { color: colors.dark, textAlign: 'center' }]}>COULDN'T BUILD YOUR EXAMPLES</Text>
        <Text style={{ color: colors.subtle, fontWeight: '700', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
          Your notes are fine — the AI service didn't answer. Check your connection and try again.
        </Text>
        <Pressable onPress={generate} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark, alignSelf: 'stretch' }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>TRY AGAIN</Text>
        </Pressable>
        <Pressable onPress={onBack} style={{ padding: 8 }}>
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 13 }}>← back to methods</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'done') {
    const connected = Object.values(flags).filter(Boolean).length;
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.green }]}>
          <Text style={[styles.heading, { color: colors.dark }]}>SESSION COMPLETE!</Text>
          <Text style={[styles.body, { color: colors.subtle }]}>
            You connected {connected} of {items.length} concepts to real life.
          </Text>
        </View>
        <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>BACK TO METHODS</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'feedback' && result && current) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: result.correct ? colors.green : colors.red }]}>
          <Text style={[styles.resultIcon, { color: result.correct ? colors.green : colors.red }]}>
            {result.correct ? '✓ YOU GOT THE LINK' : '✗ NOT QUITE'}
          </Text>
          {!!result.gotRight && <Text style={[styles.body, { color: colors.dark }]}>{result.gotRight}</Text>}
          {!!result.missed && <Text style={[styles.body, { color: colors.subtle }]}>{result.missed}</Text>}
        </View>
        <View style={[styles.infoCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>THE CONNECTION</Text>
          <Text style={[styles.infoBody, { color: colors.dark }]}>{result.reinforce}</Text>
        </View>
        <Pressable onPress={next} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {idx < items.length - 1 ? 'NEXT CONCEPT →' : 'FINISH SESSION'}
          </Text>
        </Pressable>
        <Pressable onPress={differentExample} style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: colors.dark }]}>SHOW ME A DIFFERENT EXAMPLE</Text>
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
      <Text style={[styles.progress, { color: colors.muted }]}>CONCEPT {idx + 1} OF {items.length}</Text>
      <View style={[styles.factCard, { borderColor: colors.dark }]}>
        <Text style={[styles.factLabel, { color: colors.muted }]}>CONCEPT</Text>
        <Text style={[styles.factText, { color: colors.dark }]}>{current?.concept}</Text>
        <Text style={[styles.plainText, { color: colors.subtle }]}>{current?.plainDefinition}</Text>
      </View>

      {!revealed ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRevealed(true);
          }}
          style={[styles.btn, { backgroundColor: colors.accent, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: colors.dark }]}>TAP TO SEE IT IN REAL LIFE</Text>
        </Pressable>
      ) : (
        <>
          <View style={[styles.exampleCard, { borderColor: colors.accent, backgroundColor: '#FFF3DE' }]}>
            <Text style={[styles.infoLabel, { color: colors.accent }]}>IN REAL LIFE</Text>
            <Text style={[styles.exampleText, { color: colors.dark }]}>{current?.example}</Text>
          </View>
          {!!current?.sampleProblem && (
            <View style={[styles.infoCard, { borderColor: colors.dark }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>SAMPLE PROBLEM</Text>
              <Text style={[styles.infoBody, { color: colors.dark }]}>{current.sampleProblem}</Text>
            </View>
          )}
          <View style={[styles.whyCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
            <Text style={[styles.whyText, { color: colors.primary }]}>{current?.connectionQuestion}</Text>
          </View>
          <TextInput
            style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
            value={text}
            onChangeText={setText}
            multiline
            placeholder="The example shows the concept because..."
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />
          {gradeError && (
            <Text style={{ color: colors.red, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
              Couldn't reach Chop — check your connection and try again.
            </Text>
          )}
          <Pressable
            onPress={submit}
            disabled={text.trim().length < 5}
            style={[styles.btn, { backgroundColor: text.trim().length >= 5 ? colors.primary : colors.secondary, borderColor: colors.dark }]}>
            <Text style={[styles.btnText, { color: text.trim().length >= 5 ? '#fff' : colors.muted }]}>CHECK MY CONNECTION</Text>
          </Pressable>
        </>
      )}
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
  plainText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  exampleCard: { borderWidth: 2, padding: 14, gap: 6 },
  exampleText: { fontSize: 15, fontWeight: '700', lineHeight: 24 },
  whyCard: { borderWidth: 2, padding: 14 },
  whyText: { fontSize: 15, fontWeight: '900', lineHeight: 24 },
  input: { borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 100, lineHeight: 24 },
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
