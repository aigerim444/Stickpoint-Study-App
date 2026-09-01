import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp, useEffectiveMethods } from '@/context/AppContext';
import { accountsEnabled } from '@/lib/supabase';
import { dayKey, featherIcon, getMethodById } from '@/lib/content';
import ChopCharacter from '@/components/ChopCharacter';
import colors from '@/constants/colors';
import { SAMPLE_CARDS, SAMPLE_MATERIAL, SAMPLE_TOPIC } from '@/lib/sampleMaterial';

const c = colors.light;

/**
 * The daily landing: one clear next step instead of an open menu. Ported in
 * spirit from the web app's TODAY tab — greeting, streak, due drills, the
 * recommended method for today, and the test countdown.
 */
export default function TodayTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, dueMissed, setMaterial, account } = useApp();
  const effectiveMethods = useEffectiveMethods(state);

  const hasMaterial = state.concepts && state.concepts.length > 0;
  const studiedToday = state.studiedDates.includes(dayKey(Date.now()));
  const due = dueMissed();

  const todaysMethod = useMemo(() => {
    // Rotate through the student's top 3 by day so every day has one clear
    // suggestion instead of a menu of eight.
    const top = effectiveMethods.slice(0, 3);
    if (!top.length) return null;
    const dayIndex = Math.floor(Date.now() / 86_400_000) % top.length;
    return getMethodById(top[dayIndex]) ?? getMethodById(top[0]) ?? null;
  }, [effectiveMethods]);

  const daysToTest = useMemo(() => {
    if (!state.testDate) return null;
    const [y, m, d] = state.testDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    const test = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((test.getTime() - today.getTime()) / 86_400_000);
  }, [state.testDate]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  })();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: c.muted }]}>
            {greeting}{state.name ? `, ${state.name.toUpperCase()}` : ''}
          </Text>
          <Text style={[styles.heading, { color: c.dark }]}>
            {studiedToday ? 'You showed up today 🎉' : "Today's plan"}
          </Text>
        </View>
        <ChopCharacter size={0.9} color={c.dark} animation={studiedToday ? 'celebrate' : 'bounce'} />
      </View>

      {/* Stat chips */}
      <View style={styles.chipRow}>
        <View style={[styles.chip, { borderColor: c.dark, backgroundColor: state.streak > 0 ? '#FFF3D6' : c.card }]}>
          <Text style={[styles.chipNum, { color: c.dark }]}>{state.streak}🔥</Text>
          <Text style={[styles.chipLabel, { color: c.muted }]}>DAY STREAK</Text>
        </View>
        {daysToTest != null && (
          <View style={[styles.chip, { borderColor: c.dark, backgroundColor: daysToTest <= 3 ? colors.light.redLight : c.card }]}>
            <Text style={[styles.chipNum, { color: daysToTest <= 3 ? c.red : c.dark }]}>
              {daysToTest <= 0 ? '🎓' : daysToTest}
            </Text>
            <Text style={[styles.chipLabel, { color: c.muted }]}>
              {daysToTest <= 0 ? 'TEST DAY!' : daysToTest === 1 ? 'DAY TO TEST' : 'DAYS TO TEST'}
            </Text>
          </View>
        )}
        <View style={[styles.chip, { borderColor: c.dark, backgroundColor: due.length ? colors.light.purpleLight : c.card }]}>
          <Text style={[styles.chipNum, { color: c.dark }]}>{due.length}</Text>
          <Text style={[styles.chipLabel, { color: c.muted }]}>DUE TO DRILL</Text>
        </View>
        <View style={[styles.chip, { borderColor: c.dark, backgroundColor: (state.xp || 0) > 0 ? colors.light.purpleLight : c.card }]}>
          <Text style={[styles.chipNum, { color: c.dark }]}>{state.xp || 0}⭐</Text>
          <Text style={[styles.chipLabel, { color: c.muted }]}>XP EARNED</Text>
        </View>
      </View>

      {/* No material yet */}
      {!hasMaterial && (
        <Pressable
          onPress={() => router.push('/material')}
          style={[styles.stepCard, { borderColor: c.primary, backgroundColor: colors.light.purpleLight }]}>
          <View style={[styles.stepIcon, { borderColor: c.dark, backgroundColor: c.card }]}>
            <Feather name="plus" size={20} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepTitle, { color: c.dark }]}>Add your first notes</Text>
            <Text style={[styles.stepBody, { color: c.subtle }]}>
              Paste notes or snap a photo — Chop turns them into your study plan.
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={c.muted} />
        </Pressable>
      )}
      {!hasMaterial && (
        <Pressable
          onPress={() => setMaterial(SAMPLE_MATERIAL, SAMPLE_TOPIC, SAMPLE_CARDS, false)}
          style={styles.sampleLink}>
          <Text style={[styles.sampleLinkText, { color: c.primary }]}>
            🧪 or try a sample first — Easy Chemistry
          </Text>
        </Pressable>
      )}

      {hasMaterial && (
        <>
          <Text style={[styles.sectionLabel, { color: c.primary }]}>⚡ YOUR NEXT STEP</Text>

          {/* Step 1: drill due items */}
          {due.length > 0 && (
            <Pressable
              onPress={() => router.push('/(tabs)/progress')}
              style={[styles.stepCard, { borderColor: c.dark, backgroundColor: c.card }]}>
              <View style={[styles.stepIcon, { borderColor: c.dark, backgroundColor: colors.light.purpleLight }]}>
                <Feather name="rotate-ccw" size={20} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: c.dark }]}>
                  Drill {due.length} missed item{due.length > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.stepBody, { color: c.subtle }]}>
                  They're due today — reviewing now is when spaced repetition does its magic.
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={c.muted} />
            </Pressable>
          )}

          {/* Step 2: today's method */}
          {todaysMethod && (
            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)', params: { start: todaysMethod.id } })}
              style={[styles.stepCard, { borderColor: c.dark, backgroundColor: c.card }]}>
              <View style={[styles.stepIcon, { borderColor: c.dark, backgroundColor: '#FFF3D6' }]}>
                <Feather name={featherIcon(todaysMethod.id) as never} size={20} color={c.dark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: c.dark }]}>
                  {studiedToday ? `More ${todaysMethod.label}?` : `Today: ${todaysMethod.label}`}
                </Text>
                <Text style={[styles.stepBody, { color: c.subtle }]} numberOfLines={2}>
                  {todaysMethod.whyWorks}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={c.muted} />
            </Pressable>
          )}

          {/* Step 3: topic reminder */}
          <View style={[styles.topicCard, { borderColor: c.dark }]}>
            <Text style={[styles.topicLabel, { color: c.muted }]}>STUDYING</Text>
            <Text style={[styles.topicText, { color: c.dark }]}>{state.topic || 'Your notes'}</Text>
            <Pressable onPress={() => router.push('/(tabs)/library')}>
              <Text style={[styles.switchLink, { color: c.primary }]}>Switch material →</Text>
            </Pressable>
          </View>

          {/* Set a test date nudge */}
          {!state.testDate && (
            <Pressable onPress={() => router.push('/(tabs)/plan')} style={styles.nudge}>
              <Feather name="calendar" size={14} color={c.muted} />
              <Text style={[styles.nudgeText, { color: c.muted }]}>
                Got a test coming? Set the date and Chop paces you to it.
              </Text>
            </Pressable>
          )}
        </>
      )}

      {/* Sign-in nudge — the account card lives on Progress, but nobody
          scrolls there to find it; surface it on the daily landing. */}
      {accountsEnabled && !account && (
        <Pressable
          onPress={() => router.push('/(tabs)/progress?focus=account' as never)}
          style={[styles.stepCard, { borderColor: c.dark, backgroundColor: '#FFF3D6' }]}>
          <View style={[styles.stepIcon, { borderColor: c.dark, backgroundColor: c.card }]}>
            <Feather name="cloud" size={20} color={c.dark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepTitle, { color: c.dark }]}>Save your progress</Text>
            <Text style={[styles.stepBody, { color: c.subtle }]}>
              Sign in with your email so your streak, cards, and scores follow you to any device.
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={c.muted} />
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sampleLink: { alignSelf: 'center', paddingVertical: 2 },
  sampleLinkText: { fontWeight: '800', fontSize: 13 },
  container: { padding: 20, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  greeting: { fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  heading: { fontWeight: '900', fontSize: 24, lineHeight: 32, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, borderWidth: 2.5, paddingVertical: 10, alignItems: 'center', gap: 2,
    boxShadow: '3px 3px 0px #201E2E',
  },
  chipNum: { fontSize: 20, fontWeight: '900' },
  chipLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 6 },
  stepCard: {
    borderWidth: 3, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    boxShadow: '4px 4px 0px #201E2E',
  },
  stepIcon: { width: 44, height: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontWeight: '900', fontSize: 15 },
  stepBody: { fontWeight: '600', fontSize: 12, lineHeight: 17, marginTop: 2 },
  topicCard: { borderWidth: 2.5, padding: 14, gap: 4 },
  topicLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  topicText: { fontSize: 16, fontWeight: '800' },
  switchLink: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', paddingVertical: 4 },
  nudgeText: { fontSize: 12, fontWeight: '700' },
});
