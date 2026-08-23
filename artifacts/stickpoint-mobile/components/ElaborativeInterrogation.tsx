import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { EIItem, EIVerdict, eiGenerate, eiGradeConnection, eiGradeWhy } from '@/lib/api';

interface Props {
  notes: string;
  name: string;
  age: number | null;
  onComplete: () => void;
  onBack: () => void;
}

type Phase =
  | 'loading'
  | 'why'
  | 'gradingWhy'
  | 'whyResult'
  | 'connect'
  | 'gradingConn'
  | 'connResult'
  | 'done';

export default function ElaborativeInterrogation({ notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [items, setItems] = useState<EIItem[]>([]);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [text, setText] = useState('');
  const [whyResult, setWhyResult] = useState<{ verdict: EIVerdict; feedback: string } | null>(null);
  const [connResult, setConnResult] = useState<{ verdict: EIVerdict; feedback: string; idealConnection: string } | null>(null);

  useEffect(() => {
    eiGenerate(notes, { name, age }).then((its) => {
      if (its && its.length) {
        setItems(its);
        setPhase('why');
      } else setPhase('done');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = items[qi];

  const submitWhy = useCallback(async () => {
    if (text.trim().length < 5 || !current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('gradingWhy');
    const res = await eiGradeWhy(current, text, notes, { name, age });
    setWhyResult(res ?? { verdict: 'partially_correct', feedback: 'Compare your reasoning with the model answer below.' });
    setPhase('whyResult');
  }, [text, current, notes, name, age]);

  const toConnect = useCallback(() => {
    setText('');
    setPhase('connect');
  }, []);

  const submitConn = useCallback(async () => {
    if (text.trim().length < 5 || !current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('gradingConn');
    const res = await eiGradeConnection(current, text, notes, { name, age });
    setConnResult(res ?? { verdict: 'partially_correct', feedback: 'Linking new facts to what you already know makes them stick.', idealConnection: '' });
    setPhase('connResult');
  }, [text, current, notes, name, age]);

  const next = useCallback(() => {
    if (qi < items.length - 1) {
      setQi(qi + 1);
      setPhase('why');
      setText('');
      setWhyResult(null);
      setConnResult(null);
    } else {
      setPhase('done');
      onComplete();
    }
  }, [qi, items.length, onComplete]);

  const verdictColor = (v: EIVerdict) =>
    v === 'correct' ? colors.green : v === 'partially_correct' ? colors.yellow : colors.red;
  const verdictLabel = (v: EIVerdict) =>
    v === 'correct' ? '✓ CORRECT REASONING' : v === 'partially_correct' ? '~ PARTLY THERE' : '✗ NEEDS WORK';

  if (phase === 'loading' || phase === 'gradingWhy' || phase === 'gradingConn') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.label, { color: colors.muted }]}>
          {phase === 'loading' ? 'GENERATING WHY QUESTIONS…' : 'CHECKING YOUR REASONING…'}
        </Text>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.green }]}>
          <Text style={[styles.heading, { color: colors.dark }]}>SESSION COMPLETE!</Text>
          <Text style={[styles.body, { color: colors.subtle }]}>
            You've thought through {items.length} why questions.
          </Text>
        </View>
        <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>BACK TO METHODS</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'whyResult' && whyResult && current) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: verdictColor(whyResult.verdict) }]}>
          <Text style={[styles.resultIcon, { color: verdictColor(whyResult.verdict) }]}>
            {verdictLabel(whyResult.verdict)}
          </Text>
          <Text style={[styles.body, { color: colors.dark }]}>{whyResult.feedback}</Text>
        </View>
        <View style={[styles.infoCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>MODEL ANSWER</Text>
          <Text style={[styles.infoBody, { color: colors.dark }]}>{current.modelAnswer}</Text>
        </View>
        {current.chain.length > 0 && (
          <View style={[styles.infoCard, { borderColor: colors.dark }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>
              {current.chainCaption || 'THE CHAIN OF REASONING'}
            </Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{current.chain.join('  →  ')}</Text>
          </View>
        )}
        <Pressable onPress={toConnect} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>CONNECT IT →</Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'connResult' && connResult && current) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: verdictColor(connResult.verdict) }]}>
          <Text style={[styles.resultIcon, { color: verdictColor(connResult.verdict) }]}>
            {verdictLabel(connResult.verdict)}
          </Text>
          <Text style={[styles.body, { color: colors.dark }]}>{connResult.feedback}</Text>
        </View>
        {!!connResult.idealConnection && (
          <View style={[styles.infoCard, { borderColor: colors.primary, backgroundColor: colors.purpleLight }]}>
            <Text style={[styles.infoLabel, { color: colors.primary }]}>AN IDEAL CONNECTION</Text>
            <Text style={[styles.infoBody, { color: colors.dark }]}>{connResult.idealConnection}</Text>
          </View>
        )}
        <Pressable onPress={next} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {qi < items.length - 1 ? 'NEXT QUESTION →' : 'FINISH SESSION'}
          </Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Feather name="arrow-left" size={14} color={colors.muted} />
          <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const isConnect = phase === 'connect';
  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
      <Text style={[styles.progress, { color: colors.muted }]}>Q {qi + 1} OF {items.length}</Text>
      <View style={[styles.factCard, { borderColor: colors.dark }]}>
        <Text style={[styles.factLabel, { color: colors.muted }]}>FACT</Text>
        <Text style={[styles.factText, { color: colors.dark }]}>{current?.fact}</Text>
        {!isConnect && !!current?.plainEnglish && (
          <Text style={[styles.plainText, { color: colors.subtle }]}>{current.plainEnglish}</Text>
        )}
      </View>
      <View style={[styles.whyCard, { borderColor: colors.accent, backgroundColor: '#FFF3DE' }]}>
        <Text style={[styles.whyText, { color: colors.accent }]}>
          {isConnect ? current?.connectionQuestion : current?.whyQuestion}
        </Text>
      </View>
      <TextInput
        style={[styles.input, { borderColor: colors.dark, color: colors.dark, backgroundColor: colors.card }]}
        value={text}
        onChangeText={setText}
        multiline
        placeholder={isConnect ? 'It connects because...' : 'Because...'}
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
        autoFocus
      />
      <Pressable
        onPress={isConnect ? submitConn : submitWhy}
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
  plainText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
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
