import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import PixelText from '@/components/PixelText';
import colors from '@/constants/colors';

const c = colors.light;

interface Step {
  emoji: string;
  title: string;
  body: string;
  /** Tab to show behind the card while this step is up. */
  route?: string;
}

const STEPS: Step[] = [
  {
    emoji: '🎯',
    title: 'TODAY',
    body: "Your daily plan lives here — your next study step, your streak, and anything due for review. Open this first every session.",
    route: '/(tabs)/today',
  },
  {
    emoji: '📖',
    title: 'STUDY',
    body: 'Your personalised study methods. The top ones are ranked for how YOUR brain learns, straight from your quiz answers.',
    route: '/(tabs)',
  },
  {
    emoji: '🗓',
    title: 'PLAN',
    body: 'Set your test date and see your study history on the calendar. Chop shows how many days you have left to prepare.',
    route: '/(tabs)/plan',
  },
  {
    emoji: '📈',
    title: 'PROGRESS',
    body: 'Mastered vs still-shaky items, your drill deck, practice-test scores, and your profile settings all live here.',
    route: '/(tabs)/progress',
  },
  {
    emoji: '📚',
    title: 'LIBRARY',
    body: 'Every study set you make is saved. Add new notes any time — paste, photo, or PDF — and switch between subjects.',
    route: '/(tabs)/library',
  },
  {
    emoji: '🔥',
    title: 'YOUR STREAK',
    body: 'Study every day to build your streak — even 10 minutes counts. Turn on the daily reminder in Progress so Chop can nudge you.',
    route: '/(tabs)/today',
  },
];

/**
 * The first-run guided tour, ported in spirit from the prototype's 10-step
 * spotlight — each step fronts the tab it describes. Replayable from
 * Progress → "Replay app tour".
 */
export default function AppTour() {
  const { state, setTourSeen } = useApp();
  const router = useRouter();
  const [idx, setIdx] = useState(0);

  const visible = state.loaded && !!state.name && !state.tourSeen;

  useEffect(() => {
    if (!visible) {
      setIdx(0);
      return;
    }
    const route = STEPS[idx]?.route;
    if (route) router.navigate(route as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, idx]);

  if (!visible) return null;

  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  const done = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTourSeen(true);
  };
  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) done();
    else setIdx(idx + 1);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={done}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { borderColor: c.dark }]}>
          <View style={styles.headRow}>
            <Text style={styles.emoji}>{step.emoji}</Text>
            <PixelText style={styles.title}>{step.title}</PixelText>
            <Text style={[styles.counter, { color: c.muted }]}>{idx + 1} / {STEPS.length}</Text>
          </View>
          <Text style={[styles.body, { color: c.subtle }]}>{step.body}</Text>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === idx ? c.accent : i < idx ? c.green : c.secondary, borderColor: c.dark },
                ]}
              />
            ))}
          </View>
          <View style={styles.btnRow}>
            <Pressable onPress={next} style={[styles.nextBtn, { backgroundColor: c.accent, borderColor: c.dark }]}>
              <Text style={styles.nextText}>{isLast ? 'GOT IT ✓' : 'NEXT →'}</Text>
            </Pressable>
            <Pressable onPress={done} style={[styles.skipBtn, { borderColor: c.borderLight }]}>
              <Text style={[styles.skipText, { color: c.muted }]}>SKIP</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(32, 30, 46, 0.55)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFCF6',
    borderWidth: 3,
    padding: 18,
    gap: 12,
    boxShadow: '6px 6px 0px #201E2E',
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 20 },
  title: { fontSize: 13, lineHeight: 20, flex: 1 },
  counter: { fontSize: 12, fontWeight: '800' },
  body: { fontSize: 14, fontWeight: '700', lineHeight: 21 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  btnRow: { flexDirection: 'row', gap: 10 },
  nextBtn: {
    flex: 1, borderWidth: 3, padding: 13, alignItems: 'center',
    boxShadow: '3px 3px 0px #201E2E',
  },
  nextText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  skipBtn: { borderWidth: 2, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontWeight: '800', fontSize: 12 },
});
