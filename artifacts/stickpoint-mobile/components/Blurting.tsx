import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { blurtTopics, gradeBlurt } from '@/lib/api';

interface Props {
  topic: string;
  notes: string;
  name: string;
  age: number | null;
  onComplete: () => void;
  onBack: () => void;
}

type Phase = 'loading' | 'write' | 'grading' | 'results' | 'done';

export default function Blurting({ topic, notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [blurt, setBlurt] = useState('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [covered, setCovered] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [scorePct, setScorePct] = useState(0);
  const [attempt, setAttempt] = useState(1);
  // The web flow blurts one extracted topic at a time, not the whole
  // material at once. Falls back to the single material topic if the
  // topic extraction is unavailable.
  const [topics, setTopics] = useState<string[]>([topic]);
  const [topicIdx, setTopicIdx] = useState(0);
  useEffect(() => {
    let alive = true;
    blurtTopics(notes, { name, age }).then((ts) => {
      if (!alive) return;
      if (ts && ts.length) setTopics(ts);
      setPhase('write');
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const currentTopic = topics[topicIdx] || topic;

  // The prototype's elapsed-time chip while writing.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== 'write') return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, topicIdx]);

  const submit = useCallback(async () => {
    if (!blurt.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('grading');
    const result = await gradeBlurt(blurt, notes, currentTopic, name, age);
    if (result) {
      setCovered(result.covered || []);
      setMissed(result.missed || []);
      setScorePct(result.scorePct || 0);
    }
    setPhase('results');
  }, [blurt, notes, currentTopic, name, age]);

  const retry = useCallback(() => {
    setBlurt('');
    setPhase('write');
    setAttempt((a) => a + 1);
  }, []);

  const nextTopic = useCallback(() => {
    if (topicIdx < topics.length - 1) {
      setTopicIdx(topicIdx + 1);
      setBlurt('');
      setCovered([]);
      setMissed([]);
      setScorePct(0);
      setAttempt(1);
      setPhase('write');
    } else {
      onComplete();
    }
  }, [topicIdx, topics.length, onComplete]);

  if (phase === 'loading') {
    return (
      <View style={[styles.center, { flex: 1, gap: 16, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>PICKING YOUR TOPICS…</Text>
      </View>
    );
  }

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
          <Text style={[styles.scoreSub, { color: colors.muted }]}>
            TOPIC {topicIdx + 1} OF {topics.length} · ATTEMPT {attempt}
          </Text>
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
          <Pressable onPress={nextTopic} style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.dark, flex: 1 }]}>
            <Text style={[styles.btnText, { color: colors.dark }]}>
              {topicIdx < topics.length - 1 ? 'NEXT TOPIC →' : 'DONE'}
            </Text>
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
      <View style={styles.topicRow}>
        <View style={[styles.topicBadge, { backgroundColor: colors.purpleLight, borderColor: colors.dark, flex: 1 }]}>
          <Text style={[styles.topicText, { color: colors.primary }]}>
            TOPIC {topicIdx + 1}/{topics.length}: {currentTopic.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.timerChip, { borderColor: colors.dark, backgroundColor: '#FFF3D6' }]}>
          <Text style={[styles.timerText, { color: colors.dark }]}>
            ⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </Text>
        </View>
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
  topicRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  timerChip: { borderWidth: 2, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontWeight: '900', fontSize: 12 },
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
