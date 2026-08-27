import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/lib/content';

interface Props {
  cards: Card[];
  onComplete: (hardCards: Card[]) => void;
  onBack: () => void;
  /** Drill mode: reports every rating so the caller can reschedule
      spaced-repetition boxes per card. */
  onRate?: (card: Card, rating: 'easy' | 'medium' | 'hard') => void;
}

interface CardState {
  card: Card;
  rating: 'easy' | 'medium' | 'hard' | null;
}

export default function ActiveRecall({ cards, onComplete, onBack, onRate }: Props) {
  const colors = useColors();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>(() =>
    cards.map((c) => ({ card: c, rating: null }))
  );
  const [done, setDone] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const current = cardStates[idx];
  const counts = cardStates.reduce(
    (acc, cs) => {
      if (cs.rating) acc[cs.rating]++;
      return acc;
    },
    { easy: 0, medium: 0, hard: 0 }
  );
  const hardCards = cardStates.filter((cs) => cs.rating === 'hard').map((cs) => cs.card);

  const flip = useCallback(() => {
    if (flipped) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(flipAnim, { toValue: 1, useNativeDriver: true }).start();
    setFlipped(true);
  }, [flipped, flipAnim]);

  const rate = useCallback((rating: 'easy' | 'medium' | 'hard') => {
    Haptics.impactAsync(
      rating === 'easy' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    const updated = cardStates.map((cs, i) => (i === idx ? { ...cs, rating } : cs));
    setCardStates(updated);
    if (current) onRate?.(current.card, rating);

    if (idx < cardStates.length - 1) {
      Animated.timing(flipAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      setFlipped(false);
      setIdx(idx + 1);
    } else {
      const allRated = updated.every((cs) => cs.rating !== null);
      if (allRated) {
        setDone(true);
        onComplete(updated.filter((cs) => cs.rating === 'hard').map((cs) => cs.card));
      }
    }
  }, [cardStates, idx, flipAnim, onComplete]);

  const answerOpacity = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  if (done) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.card, { borderColor: colors.green, boxShadow: `5px 5px 0px ${colors.green}` }]}>
          <Text style={[styles.sessionComplete]}>SESSION COMPLETE!</Text>
          <View style={styles.countRow}>
            <View style={[styles.countBadge, { backgroundColor: colors.greenLight, borderColor: colors.green }]}>
              <Text style={[styles.countLabel, { color: colors.dark }]}>EASY</Text>
              <Text style={[styles.countNum, { color: colors.dark }]}>{counts.easy}</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.yellowLight, borderColor: colors.yellow }]}>
              <Text style={[styles.countLabel, { color: colors.dark }]}>MEDIUM</Text>
              <Text style={[styles.countNum, { color: colors.dark }]}>{counts.medium}</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.redLight, borderColor: colors.red }]}>
              <Text style={[styles.countLabel, { color: colors.dark }]}>HARD</Text>
              <Text style={[styles.countNum, { color: colors.dark }]}>{counts.hard}</Text>
            </View>
          </View>
        </View>
        {hardCards.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.red }]}>FOCUS ON THESE NEXT TIME</Text>
            {hardCards.map((c, i) => (
              <View key={i} style={[styles.hardCard, { borderColor: colors.red }]}>
                <Text style={[styles.hardQ, { color: colors.dark }]}>{c.question}</Text>
                <Text style={[styles.hardA, { color: colors.subtle }]}>{c.answer}</Text>
              </View>
            ))}
          </>
        )}
        <Pressable onPress={onBack} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>BACK TO METHODS</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={[styles.progressLabel, { color: colors.muted }]}>
          CARD {idx + 1} OF {cardStates.length}
        </Text>
        {current?.card.methodTag && (
          <View style={[styles.methodBadge, { backgroundColor: colors.purpleLight, borderColor: colors.dark }]}>
            <Text style={[styles.methodBadgeText, { color: colors.primary }]}>{current.card.methodTag}</Text>
          </View>
        )}
      </View>
      <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { width: `${((idx) / cardStates.length) * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      {/* Card */}
      <Pressable onPress={flip} style={[styles.flashCard, { borderColor: colors.dark, boxShadow: `5px 5px 0px ${colors.primary}` }]}>
        <Text style={[styles.question, { color: colors.dark }]}>{current?.card.question}</Text>
        <Animated.View style={{ opacity: answerOpacity }}>
          {flipped && (
            <Text style={[styles.answer, { color: colors.primary }]}>{current?.card.answer}</Text>
          )}
        </Animated.View>
        {!flipped && (
          <Text style={[styles.tapHint, { color: colors.muted }]}>tap to reveal</Text>
        )}
      </Pressable>

      {/* Actions */}
      {!flipped ? (
        <Pressable onPress={flip} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>REVEAL ANSWER</Text>
        </Pressable>
      ) : (
        <>
          <Text style={[styles.ratePrompt, { color: colors.mutedAlt }]}>how did that feel?</Text>
          <View style={styles.rateRow}>
            <Pressable onPress={() => rate('hard')} style={[styles.rateBtn, { backgroundColor: colors.red, borderColor: colors.dark }]}>
              <Text style={styles.rateBtnText}>HARD</Text>
            </Pressable>
            <Pressable onPress={() => rate('medium')} style={[styles.rateBtn, { backgroundColor: colors.yellow, borderColor: colors.dark }]}>
              <Text style={[styles.rateBtnText, { color: colors.dark }]}>MEDIUM</Text>
            </Pressable>
            <Pressable onPress={() => rate('easy')} style={[styles.rateBtn, { backgroundColor: colors.green, borderColor: colors.dark }]}>
              <Text style={styles.rateBtnText}>EASY</Text>
            </Pressable>
          </View>
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
  container: { padding: 20, gap: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  methodBadge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 2 },
  methodBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  progressBar: { height: 12, borderWidth: 3, borderColor: '#201E2E', overflow: 'hidden' },
  progressFill: { height: '100%' },
  flashCard: {
    minHeight: 180, borderWidth: 3, borderRadius: 0,
    padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16,
    boxShadow: '5px 5px 0px #201E2E',
  },
  question: { fontSize: 17, fontWeight: '800', textAlign: 'center', lineHeight: 26 },
  answer: { fontSize: 17, fontWeight: '900', textAlign: 'center', lineHeight: 26 },
  tapHint: { fontSize: 12, fontWeight: '700' },
  ratePrompt: { textAlign: 'center', fontSize: 12, fontWeight: '700' },
  rateRow: { flexDirection: 'row', gap: 8 },
  rateBtn: { flex: 1, borderWidth: 3, padding: 13, alignItems: 'center' },
  rateBtnText: { fontWeight: '900', fontSize: 13, color: '#fff' },
  btn: { borderWidth: 3, padding: 15, alignItems: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
  card: { borderWidth: 3, padding: 20, alignItems: 'center', gap: 14,
    boxShadow: '5px 5px 0px #201E2E',
  },
  sessionComplete: { fontFamily: 'NunitoBlack', fontSize: 15, fontWeight: '900', color: '#201E2E', letterSpacing: 1 },
  countRow: { flexDirection: 'row', gap: 8 },
  countBadge: { borderWidth: 2, padding: 10, alignItems: 'center', gap: 2 },
  countLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  countNum: { fontSize: 18, fontWeight: '900' },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  hardCard: { borderWidth: 3, padding: 12, gap: 4 },
  hardQ: { fontSize: 13, fontWeight: '800', lineHeight: 20 },
  hardA: { fontSize: 12, fontWeight: '700', lineHeight: 18 },
  subtle: { color: '#463f52' },
});
