import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp, useEffectiveMethods } from '@/context/AppContext';
import { METHODS, getMethodById, Card } from '@/lib/content';
import ActiveRecall from '@/components/ActiveRecall';
import Blurting from '@/components/Blurting';
import Feynman from '@/components/Feynman';
import PracticeTest from '@/components/PracticeTest';
import Pomodoro from '@/components/Pomodoro';
import SelfExplanation from '@/components/SelfExplanation';
import ElaborativeInterrogation from '@/components/ElaborativeInterrogation';
import ChopCharacter from '@/components/ChopCharacter';
import colors from '@/constants/colors';

const c = colors.light;

export default function StudyTab() {
  const insets = useSafeAreaInsets();
  const { state, setActiveMethod, recordSession, recordMissed, addPtResult } = useApp();
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const effectiveMethods = useEffectiveMethods(state);
  const topThree = effectiveMethods.slice(0, 3);
  const rest = effectiveMethods.slice(3);

  const startMethod = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveMethod(id);
    setActiveSession(id);
  }, [setActiveMethod]);

  const endSession = useCallback((hardCards?: Card[], ptScore?: number, ptTotal?: number) => {
    if (activeSession) {
      recordSession(activeSession);
      if (hardCards?.length) {
        recordMissed(hardCards.map(c => ({ question: c.question, answer: c.answer })), activeSession);
      }
      if (ptScore !== undefined && ptTotal !== undefined) {
        addPtResult(ptScore, ptTotal);
      }
    }
    setActiveSession(null);
  }, [activeSession, recordSession, recordMissed, addPtResult]);

  const goBack = useCallback(() => setActiveSession(null), []);

  const hasMaterial = state.concepts && state.concepts.length > 0;

  // Render active session
  if (activeSession && hasMaterial) {
    const scrollProps = { style: { flex: 1, backgroundColor: c.background } };
    if (activeSession === 'active_recall') {
      return (
        <View style={[{ flex: 1, backgroundColor: c.background }]}>
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.sessionTitle}>ACTIVE RECALL</Text>
          </View>
          <ActiveRecall
            cards={state.concepts}
            onComplete={(hard) => endSession(hard)}
            onBack={goBack}
          />
        </View>
      );
    }
    if (activeSession === 'blurting') {
      return (
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.sessionTitle}>BLURTING</Text>
          </View>
          <Blurting
            topic={state.topic}
            notes={state.material}
            name={state.name}
            age={state.age}
            onComplete={() => endSession()}
            onBack={goBack}
          />
        </View>
      );
    }
    if (activeSession === 'feynman') {
      return (
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.sessionTitle}>FEYNMAN TECHNIQUE</Text>
          </View>
          <Feynman
            cards={state.concepts.slice(0, 6)}
            name={state.name}
            age={state.age}
            onComplete={(hard) => endSession(hard)}
            onBack={goBack}
          />
        </View>
      );
    }
    if (activeSession === 'practice_testing') {
      return (
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.sessionTitle}>PRACTICE TEST</Text>
          </View>
          <PracticeTest
            cards={state.concepts}
            onComplete={(hard, score, total) => endSession(hard, score, total)}
            onBack={goBack}
          />
        </View>
      );
    }
    if (activeSession === 'pomodoro') {
      return (
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.sessionTitle}>POMODORO TIMER</Text>
          </View>
          <Pomodoro
            topic={state.topic}
            notes={state.material}
            onComplete={() => endSession()}
            onBack={goBack}
          />
        </View>
      );
    }
    if (activeSession === 'self_explanation') {
      return (
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.sessionTitle}>SELF-EXPLANATION</Text>
          </View>
          <SelfExplanation
            notes={state.material}
            name={state.name}
            age={state.age}
            onComplete={(hard) => endSession(hard)}
            onBack={goBack}
          />
        </View>
      );
    }
    if (activeSession === 'elaborative_interrogation') {
      return (
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.sessionHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.sessionTitle}>ELABORATIVE INTERROGATION</Text>
          </View>
          <ElaborativeInterrogation
            cards={state.concepts}
            name={state.name}
            age={state.age}
            onComplete={() => endSession()}
            onBack={goBack}
          />
        </View>
      );
    }
  }

  // Method selector
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }]}>

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: c.muted }]}>HEY {state.name?.toUpperCase() || 'THERE'}</Text>
          <Text style={[styles.topic, { color: c.dark }]}>
            {state.topic || 'No material yet'}
          </Text>
        </View>
        <ChopCharacter size={0.85} color={c.primary} animation="bounce" />
      </View>

      {!hasMaterial && (
        <View style={[styles.emptyCard, { borderColor: c.accent }]}>
          <Feather name="book-open" size={28} color={c.accent} />
          <Text style={[styles.emptyTitle, { color: c.dark }]}>No material yet</Text>
          <Text style={[styles.emptyBody, { color: c.subtle }]}>
            Head to the Library tab to add your notes and get started.
          </Text>
        </View>
      )}

      {hasMaterial && (
        <>
          {/* Top recommended methods */}
          <Text style={[styles.sectionLabel, { color: c.primary }]}>⚡ RECOMMENDED FOR YOU</Text>
          {topThree.map((id) => {
            const m = getMethodById(id);
            if (!m) return null;
            return (
              <MethodCard key={id} method={m} highlighted onPress={() => startMethod(id)} />
            );
          })}

          {/* Rest */}
          {rest.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: c.muted }]}>ALL METHODS</Text>
              {rest.map((id) => {
                const m = getMethodById(id);
                if (!m) return null;
                return (
                  <MethodCard key={id} method={m} highlighted={false} onPress={() => startMethod(id)} />
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function MethodCard({ method, highlighted, onPress }: {
  method: ReturnType<typeof getMethodById> & object;
  highlighted: boolean;
  onPress: () => void;
}) {
  if (!method) return null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.methodCard,
        {
          borderColor: c.dark,
          backgroundColor: highlighted ? c.card : c.cardAlt,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={[styles.methodIcon, { backgroundColor: highlighted ? c.purpleLight : c.secondary, borderColor: c.dark }]}>
        <Feather name={method.icon as any} size={20} color={highlighted ? c.primary : c.dark} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.methodLabel, { color: c.dark }]}>{method.label}</Text>
        <Text style={[styles.methodDesc, { color: c.subtle }]} numberOfLines={2}>{method.whyWorks}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={c.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  topic: { fontWeight: '900', fontSize: 18, lineHeight: 26, maxWidth: 220 },
  sectionLabel: { fontWeight: '900', fontSize: 10, letterSpacing: 1.5, marginTop: 4 },
  methodCard: {
    borderWidth: 3, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    boxShadow: '4px 4px 0px #201E2E',
  },
  methodIcon: { width: 44, height: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontWeight: '900', fontSize: 14 },
  methodDesc: { fontWeight: '600', fontSize: 12, lineHeight: 18 },
  sessionHeader: {
    backgroundColor: c.dark, paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 0,
  },
  sessionTitle: { color: '#FFC93C', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  emptyCard: { borderWidth: 3, borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontWeight: '900', fontSize: 16 },
  emptyBody: { fontWeight: '700', fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
