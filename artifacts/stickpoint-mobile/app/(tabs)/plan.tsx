import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabContentPadding } from '@/hooks/useTabContentPadding';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import PixelText from '@/components/PixelText';
import { dayKey } from '@/lib/content';
import colors from '@/constants/colors';

const c = colors.light;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * The Plan tab: a study calendar (which days you actually showed up) and
 * the test-date countdown that paces everything. Tap a future day to set
 * your test date. Ported in spirit from the web app's PLAN tab.
 */
export default function PlanTab() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabContentPadding();
  const { state, setTestDate, toggleStudiedDay } = useApp();
  const [calMode, setCalMode] = useState<'test' | 'studied'>('test');
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const studied = useMemo(() => new Set(state.studiedDates), [state.studiedDates]);
  const todayKey = dayKey(Date.now());
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const daysToTest = useMemo(() => {
    if (!state.testDate) return null;
    const [y, m, d] = state.testDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    return Math.round((new Date(y, m - 1, d).getTime() - todayStart) / 86_400_000);
  }, [state.testDate, todayStart]);

  // Calendar grid: leading blanks + the month's days.
  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [viewYear, viewMonth]);

  const studiedThisMonth = useMemo(
    () =>
      state.studiedDates.filter((k) => {
        const [y, m] = k.split('-').map(Number);
        return y === viewYear && m === viewMonth + 1;
      }).length,
    [state.studiedDates, viewYear, viewMonth],
  );

  const nav = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const onDayPress = (day: number) => {
    const pressed = new Date(viewYear, viewMonth, day).getTime();
    if (calMode === 'studied') {
      // The prototype's MARK STUDIED mode: record days you studied offline.
      // Only the past and today — you can't have studied tomorrow yet.
      if (pressed > todayStart) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleStudiedDay(dayKey(pressed));
      return;
    }
    if (pressed < todayStart) return; // past days are history, not plans
    const key = iso(viewYear, viewMonth, day);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (state.testDate === key) {
      if (Platform.OS === 'web') {
        if (window.confirm('Remove this test date from your plan?')) setTestDate(null);
      } else {
        Alert.alert('Remove test date?', 'Clear this test from your plan?', [
          { text: 'Keep it', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => setTestDate(null) },
        ]);
      }
    } else {
      // Tapping any other future day simply moves the test there.
      setTestDate(key);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: bottomPad }]}>
      <PixelText style={styles.headingPixel}>PLAN</PixelText>

      {/* Calendar mode — tap days to set the test, or to mark offline study */}
      <View style={styles.modeRow}>
        <Pressable
          onPress={() => setCalMode('test')}
          style={[styles.modeBtn, { borderColor: c.dark, backgroundColor: calMode === 'test' ? c.red : c.card }]}>
          <View style={styles.modeBtnRow}>
            <Feather name="target" size={14} color={calMode === 'test' ? '#fff' : c.dark} />
            <Text style={[styles.modeBtnText, { color: calMode === 'test' ? '#fff' : c.dark }]}>SET TEST DAY</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => setCalMode('studied')}
          style={[styles.modeBtn, { borderColor: c.dark, backgroundColor: calMode === 'studied' ? c.green : c.card }]}>
          <View style={styles.modeBtnRow}>
            <Feather name="check-square" size={14} color={calMode === 'studied' ? '#12291f' : c.dark} />
            <Text style={[styles.modeBtnText, { color: calMode === 'studied' ? '#12291f' : c.dark }]}>MARK STUDIED</Text>
          </View>
        </Pressable>
      </View>

      {/* Test countdown */}
      <View
        style={[
          styles.countdownCard,
          {
            borderColor: c.dark,
            backgroundColor:
              daysToTest == null ? c.card : daysToTest <= 3 ? colors.light.redLight : '#FFF3D6',
          },
        ]}>
        {daysToTest == null ? (
          <>
            <Text style={[styles.countdownTitle, { color: c.dark }]}>No test date set</Text>
            <Text style={[styles.countdownBody, { color: c.subtle }]}>
              Tap a day below to set one — a real date beats "sometime soon".
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.countdownNum, { color: daysToTest <= 3 ? c.red : c.dark }]}>
              {daysToTest <= 0 ? 'TEST DAY!' : `${daysToTest} day${daysToTest === 1 ? '' : 's'}`}
            </Text>
            <Text style={[styles.countdownBody, { color: c.subtle }]}>
              {daysToTest <= 0
                ? "You put in the work. Go show it."
                : `until your test on ${state.testDate}. Tap the marked day to change it.`}
            </Text>
          </>
        )}
      </View>

      {/* Calendar */}
      <View style={[styles.calCard, { borderColor: c.dark }]}>
        <View style={styles.calHeader}>
          <Pressable onPress={() => nav(-1)} style={styles.calNav}>
            <Feather name="chevron-left" size={20} color={c.dark} />
          </Pressable>
          <Text style={[styles.calTitle, { color: c.dark }]}>
            {MONTHS[viewMonth].toUpperCase()} {viewYear}
          </Text>
          <Pressable onPress={() => nav(1)} style={styles.calNav}>
            <Feather name="chevron-right" size={20} color={c.dark} />
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={[styles.weekday, { color: c.muted }]}>{w}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={styles.cell} />;
            const key = dayKey(new Date(viewYear, viewMonth, day).getTime());
            const isStudied = studied.has(key);
            const isToday = key === todayKey;
            const isTest = state.testDate === iso(viewYear, viewMonth, day);
            return (
              <Pressable key={day} onPress={() => onDayPress(day)} style={styles.cell}>
                <View
                  style={[
                    styles.dayDot,
                    isStudied && { backgroundColor: c.green, borderColor: c.dark, borderWidth: 2 },
                    isTest && { backgroundColor: c.red, borderColor: c.dark, borderWidth: 2 },
                    isToday && !isStudied && !isTest && { borderColor: c.primary, borderWidth: 2 },
                  ]}>
                  {isTest ? (
                    <Feather name="target" size={13} color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.dayText,
                        { color: isStudied ? '#fff' : isToday ? c.primary : c.dark },
                      ]}>
                      {day}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: c.green }]} />
          <Text style={[styles.legendText, { color: c.muted }]}>studied</Text>
          <View style={[styles.legendDot, { backgroundColor: c.red }]} />
          <Text style={[styles.legendText, { color: c.muted }]}>test day</Text>
          <View style={[styles.legendDot, { borderColor: c.primary, borderWidth: 2, backgroundColor: 'transparent' }]} />
          <Text style={[styles.legendText, { color: c.muted }]}>today</Text>
        </View>
      </View>

      <View style={[styles.statCard, { borderColor: c.dark }]}>
        <Text style={[styles.statNum, { color: c.dark }]}>{studiedThisMonth}</Text>
        <Text style={[styles.statLabel, { color: c.muted }]}>
          DAYS STUDIED IN {MONTHS[viewMonth].toUpperCase()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: { flex: 1, borderWidth: 3, paddingVertical: 12, alignItems: 'center',
    boxShadow: '3px 3px 0px #201E2E' },
  modeBtnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  modeBtnText: { fontWeight: '900', fontSize: 12 },
  headingPixel: { fontSize: 18, lineHeight: 28 },
  container: { padding: 20, gap: 14 },
  heading: { fontWeight: '900', fontSize: 26 },
  countdownCard: {
    borderWidth: 3, padding: 18, gap: 4,
    boxShadow: '4px 4px 0px #201E2E',
  },
  countdownTitle: { fontSize: 16, fontWeight: '900' },
  countdownNum: { fontSize: 28, fontWeight: '900' },
  countdownBody: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  calCard: {
    borderWidth: 3, padding: 14, gap: 10, backgroundColor: '#fff',
    boxShadow: '4px 4px 0px #201E2E',
  },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calNav: { padding: 6 },
  calTitle: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayDot: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '800' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingTop: 2 },
  legendDot: { width: 12, height: 12 },
  legendText: { fontSize: 11, fontWeight: '700', marginRight: 8 },
  statCard: {
    borderWidth: 2.5, padding: 14, alignItems: 'center', gap: 2,
  },
  statNum: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
