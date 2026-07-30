import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { gradeBlurt } from '@/lib/api';

interface Props {
  topic: string;
  notes: string;
  name: string;
  age: number | null;
  onComplete: () => void;
  onBack: () => void;
}

type Phase = 'write' | 'grading' | 'results';

export default function Blurting({ topic, notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [blurt, setBlurt] = useState('');
  const [phase, setPhase] = useState<Phase>('write');
  const [covered, setCovered] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [scorePct, setScorePct] = useState(0);
  const [attempt, setAttempt] = useState(1);

  const submit = useCallback(async () => {
    if (!blurt.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const result = await gradeBlurt(blurt, notes, topic, name, age);
    if (result) {
      setCovered(result.covered || []);
      setMissed(result.missed || []);
      setScorePct(result.scorePct || 0);
    }
    setPhase('results');
  }, [blurt, notes, topic, name, age]);

  const retry = useCallback(() => {
    setBlurt('');
    setPhase('write');
    setAttempt((a) => a + 1);
  }, []);

  if (phase === 'grading') {
    return (
      <View style={[styles.center, { flex: 1, gap: 16, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>GRADING YOUR BLURT…</Text>
      </View>
    );
  }

  if (phase === 'results') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        {/* Score */}
        <View style={[styles.scoreCard, { borderColor: scorePct >= 70 ? colors.green : scorePct >= 40 ? colors.yellow : colors.red }]}>
          <Text style={[styles.scoreNum, { color: colors.dark }]}>{scorePct}%</Text>
          <Text style={[styles.scoreSub, { color: colors.muted }]}>ATTEMPT {attempt}</Text>
        </View>

        {covered.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.green }]}>✓ COVERED ({covered.length})</Text>
            {covered.map((c, i) => (
              <View key={i} style={[styles.item, { borderColor: colors.green, backgroundColor: colors.greenLight }]}>
                <Text style={[styles.itemText, { color: colors.dark }]}>{c}</Text>
              </View>
            ))}
          </>
        )}

        {missed.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.red }]}>✗ MISSED ({missed.length})</Text>
            {missed.map((c, i) => (
              <View key={i} style={[styles.item, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
                <Text style={[styles.itemText, { color: colors.dark }]}>{c}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.btnRow}>
          {missed.length > 0 ? (
            <Pressable onPress={retry} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark, flex: 1 }]}>
              <Text style={[styles.btnText, { color: '#fff' }]}>BLURT AGAIN</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => { onComplete(); }} style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.dark, flex: 1 }]}>
            <Text style={[styles.btnText, { color: colors.dark }]}>DONE</Text>
          </Pressable>
        </View>

        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.topicBadge, { backgroundColor: colors.purpleLight, borderColor: colors.dark }]}>
        <Text style={[styles.topicText, { color: colors.primary }]}>TOPIC: {topic.toUpperCase()}</Text>
      </View>
      <Text style={[styles.heading, { color: colors.dark }]}>Write everything you know</Text>
      <Text style={[styles.body, { color: colors.subtle }]}>
        Close your eyes for a moment. Now write everything you can remember about this topic — no looking at your notes!
      </Text>
      <TextInput
        style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
        value={blurt}
        onChangeText={setBlurt}
        multiline
        placeholder="Start writing everything you remember..."
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
        autoFocus
      />
      <Text style={[styles.charCount, { color: colors.muted }]}>{blurt.length} characters</Text>
      <Pressable
        onPress={submit}
        disabled={blurt.trim().length < 10}
        style={[
          styles.btn,
          { backgroundColor: blurt.trim().length >= 10 ? colors.primary : colors.secondary, borderColor: colors.dark },
        ]}>
        <Text style={[styles.btnText, { color: blurt.trim().length >= 10 ? '#fff' : colors.muted }]}>CHECK MY BLURT</Text>
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
  topicBadge: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  topicText: { fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  heading: { fontWeight: '900', fontSize: 20, lineHeight: 28 },
  body: { fontWeight: '700', fontSize: 14, lineHeight: 22 },
  input: { borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 200, lineHeight: 24 },
  charCount: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  btn: {
    borderWidth: 3, padding: 15, alignItems: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
  scoreCard: {
    borderWidth: 3, padding: 24, alignItems: 'center', gap: 4,
    boxShadow: '5px 5px 0px #201E2E',
  },
  scoreNum: { fontWeight: '900', fontSize: 48 },
  scoreSub: { fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  item: { borderWidth: 2, padding: 10 },
  itemText: { fontWeight: '700', fontSize: 13, lineHeight: 20 },
});
