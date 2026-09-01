import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import EtaBar from '@/components/EtaBar';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { gradeSelfExplain, seChunks } from '@/lib/api';
import { Card } from '@/lib/content';

interface Props {
  notes: string;
  name: string;
  age: number | null;
  onComplete: (hard: Card[]) => void;
  onBack: () => void;
}

type Phase = 'reading' | 'writing' | 'grading' | 'feedback';

export default function SelfExplanation({ notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  // Local fallback: raw line split. The server's one-idea chunking replaces
  // it once loaded (pasted paragraphs don't split usefully on newlines).
  const fallbackLines = useMemo(
    () => notes.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 20),
    [notes],
  );
  const [lines, setLines] = useState<string[]>(fallbackLines);
  const [chunking, setChunking] = useState(true);
  useEffect(() => {
    let alive = true;
    seChunks(notes, { name, age }).then((chunks) => {
      if (!alive) return;
      if (chunks && chunks.length) setLines(chunks.map((c) => c.chunk));
      setChunking(false);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [lineIdx, setLineIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('reading');
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ correct: boolean; feedback: string; simpler: string } | null>(null);
  const [hardLines, setHardLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const current = lines[lineIdx] || '';

  const startWrite = () => {
    setText('');
    setPhase('writing');
  };

  const submit = useCallback(async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const res = await gradeSelfExplain(current, text, name, age);
    setResult(res);
    setPhase('feedback');
  }, [text, current, name, age]);

  const next = useCallback(() => {
    if (!result) return;
    const newHard = !result.correct ? [...hardLines, current] : hardLines;
    if (lineIdx < lines.length - 1) {
      setHardLines(newHard);
      setLineIdx(lineIdx + 1);
      setPhase('reading');
      setText('');
      setResult(null);
    } else {
      setDone(true);
      const hardCards: Card[] = newHard.map(l => ({ question: 'Explain in your own words:', answer: l, methodTag: 'self_explanation' }));
      onComplete(hardCards);
    }
  }, [result, hardLines, lineIdx, lines.length, current, onComplete]);

  if (chunking) {
    return (
      <View style={[styles.center, { flex: 1, gap: 14, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>SPLITTING YOUR NOTES…</Text>
        <EtaBar seconds={12} />
      </View>
    );
  }

  if (done) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.green }]}>
          <Text style={[styles.heading, { color: colors.dark }]}>ALL LINES DONE!</Text>
          <Text style={[styles.body, { color: colors.subtle }]}>
            Fumbled {hardLines.length} of {lines.length} lines.
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
      <View style={[styles.center, { flex: 1, gap: 14, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>CHECKING…</Text>
      </View>
    );
  }

  if (phase === 'feedback' && result) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: result.correct ? colors.green : colors.red }]}>
          <Text style={[styles.resultIcon, { color: result.correct ? colors.green : colors.red }]}>
            {result.correct ? '✓ GOT IT' : '✗ MISSED IT'}
          </Text>
          <Text style={[styles.body, { color: colors.dark }]}>{result.feedback}</Text>
        </View>
        <View style={[styles.infoCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>SIMPLER VERSION</Text>
          <Text style={[styles.infoBody, { color: colors.dark }]}>{result.simpler}</Text>
        </View>
        <Pressable onPress={next} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {lineIdx < lines.length - 1 ? 'NEXT LINE →' : 'FINISH'}
          </Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'writing') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.progress, { color: colors.muted }]}>LINE {lineIdx + 1} OF {lines.length}</Text>
        <View style={[styles.sourceCard, { borderColor: colors.dark }]}>
          <Text style={[styles.sourceLabel, { color: colors.muted }]}>ORIGINAL</Text>
          <Text style={[styles.sourceLine, { color: colors.dark }]}>{current}</Text>
        </View>
        <Text style={[styles.hint, { color: colors.subtle }]}>Now say this in your own words:</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="In my own words..."
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          autoFocus
        />
        <Pressable
          onPress={submit}
          disabled={text.trim().length < 5}
          style={[styles.btn, { backgroundColor: text.trim().length >= 5 ? colors.primary : colors.secondary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: text.trim().length >= 5 ? '#fff' : colors.muted }]}>CHECK IT</Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
      <Text style={[styles.progress, { color: colors.muted }]}>LINE {lineIdx + 1} OF {lines.length}</Text>
      <View style={[styles.sourceCard, { borderColor: colors.dark }]}>
        <Text style={[styles.sourceLabel, { color: colors.muted }]}>READ THIS</Text>
        <Text style={[styles.sourceLine, { color: colors.dark }]}>{current}</Text>
      </View>
      <Text style={[styles.hint, { color: colors.subtle }]}>
        Read it carefully. When you're ready, you'll say it back in your own words.
      </Text>
      <Pressable onPress={startWrite} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
        <Text style={[styles.btnText, { color: '#fff' }]}>I'M READY</Text>
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
  label: { fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  progress: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  card: { borderWidth: 3, padding: 20, gap: 8,
    boxShadow: '4px 4px 0px #201E2E',
  },
  heading: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  body: { fontSize: 14, fontWeight: '700', lineHeight: 22 },
  sourceCard: { borderWidth: 3, padding: 16, gap: 6 },
  sourceLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  sourceLine: { fontSize: 16, fontWeight: '800', lineHeight: 26 },
  hint: { fontSize: 13, fontWeight: '700', lineHeight: 20 },
  input: { borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 120, lineHeight: 24 },
  resultIcon: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
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
