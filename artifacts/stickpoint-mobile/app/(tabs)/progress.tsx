import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { METHODS } from '@/lib/content';
import colors from '@/constants/colors';
import { scheduleDaily, cancelDailyReminder } from '@/lib/notifications';

const c = colors.light;

export default function ProgressTab() {
  const insets = useSafeAreaInsets();
  const { state, gradeMissedItem, dueMissed, setNotificationPreference } = useApp();

  // Local mirror for notification time so the UI updates immediately
  const [notifHour, setNotifHour] = useState(state.notificationHour ?? 20);
  const [notifMinute, setNotifMinute] = useState(state.notificationMinute ?? 0);

  const adjustHour = (delta: number) => setNotifHour((h) => (h + delta + 24) % 24);
  const adjustMinute = (delta: number) => setNotifMinute((m) => (m + delta + 60) % 60);

  const fmt12 = (h: number) => {
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { h12: String(h12), ampm };
  };
  const { h12, ampm } = fmt12(notifHour);
  const minStr = String(notifMinute).padStart(2, '0');

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const scheduled = await scheduleDaily(notifHour, notifMinute, state.streak ?? 0);
      if (scheduled) {
        setNotificationPreference(true, notifHour, notifMinute);
      } else {
        Alert.alert(
          'Permission needed',
          'Allow notifications in your device settings to receive daily study reminders.',
        );
      }
    } else {
      await cancelDailyReminder();
      setNotificationPreference(false, notifHour, notifMinute);
    }
  };

  const handleSaveTime = async () => {
    const scheduled = await scheduleDaily(notifHour, notifMinute, state.streak ?? 0);
    if (scheduled) {
      setNotificationPreference(true, notifHour, notifMinute);
    } else {
      Alert.alert(
        'Permission needed',
        'Allow notifications in your device settings to receive daily study reminders.',
      );
    }
  };

  const due = dueMissed();
  const methodsTriedCount = Object.keys(state.methodsTried || {}).length;
  const ptHistory = state.ptHistory || [];
  const lastPt = ptHistory[ptHistory.length - 1];
  const avgPt = ptHistory.length
    ? Math.round(ptHistory.reduce((a, p) => a + (p.score / p.total) * 100, 0) / ptHistory.length)
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>

      {/* Header */}
      <Text style={[styles.heading, { color: c.dark }]}>Progress</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatBox label="STREAK" value={`${state.streak || 0}d`} color={c.accent} />
        <StatBox label="SESSIONS" value={String(state.sessionsFinished || 0)} color={c.primary} />
        <StatBox label="METHODS" value={`${methodsTriedCount}/${METHODS.length}`} color={c.green} />
      </View>

      {/* Practice test history */}
      {ptHistory.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: c.dark }]}>PRACTICE TEST SCORES</Text>
          <View style={[styles.card, { borderColor: c.dark }]}>
            <View style={styles.ptRow}>
              <View style={styles.ptStat}>
                <Text style={[styles.ptStatNum, { color: c.primary }]}>{avgPt}%</Text>
                <Text style={[styles.ptStatLabel, { color: c.muted }]}>AVERAGE</Text>
              </View>
              {lastPt && (
                <View style={styles.ptStat}>
                  <Text style={[styles.ptStatNum, { color: c.dark }]}>
                    {Math.round((lastPt.score / lastPt.total) * 100)}%
                  </Text>
                  <Text style={[styles.ptStatLabel, { color: c.muted }]}>LAST TEST</Text>
                </View>
              )}
              <View style={styles.ptStat}>
                <Text style={[styles.ptStatNum, { color: c.dark }]}>{ptHistory.length}</Text>
                <Text style={[styles.ptStatLabel, { color: c.muted }]}>TESTS TAKEN</Text>
              </View>
            </View>
            {/* Mini bar chart */}
            <View style={styles.barChart}>
              {ptHistory.slice(-8).map((p, i) => {
                const pct = (p.score / p.total) * 100;
                const barColor = pct >= 70 ? c.green : pct >= 50 ? c.yellow : c.red;
                return (
                  <View key={i} style={styles.barWrap}>
                    <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: barColor, borderColor: c.dark }]} />
                    <Text style={[styles.barLabel, { color: c.muted }]}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* Due missed items */}
      {due.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: c.red }]}>
            DRILL DECK — {due.length} DUE
          </Text>
          {due.slice(0, 6).map((item) => (
            <View key={item.key} style={[styles.missedCard, { borderColor: c.dark }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.missedQ, { color: c.dark }]}>{item.question}</Text>
                <Text style={[styles.missedA, { color: c.subtle }]}>{item.answer}</Text>
                <Text style={[styles.missedMeta, { color: c.muted }]}>
                  missed {item.misses}× · box {item.box + 1}
                </Text>
              </View>
              <View style={styles.gradeButtons}>
                <Pressable
                  onPress={() => gradeMissedItem(item.key, 'hard')}
                  style={[styles.gradeBtn, { backgroundColor: c.red, borderColor: c.dark }]}>
                  <Text style={styles.gradeBtnText}>HARD</Text>
                </Pressable>
                <Pressable
                  onPress={() => gradeMissedItem(item.key, 'easy')}
                  style={[styles.gradeBtn, { backgroundColor: c.green, borderColor: c.dark }]}>
                  <Text style={styles.gradeBtnText}>GOT IT</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {due.length > 6 && (
            <Text style={[styles.moreLabel, { color: c.muted }]}>+{due.length - 6} more in drill deck</Text>
          )}
        </>
      )}

      {/* All missed bank */}
      {(state.missedBank || []).length > 0 && due.length === 0 && (
        <View style={[styles.allClearCard, { borderColor: c.green, backgroundColor: c.greenLight }]}>
          <Feather name="check-circle" size={24} color={c.green} />
          <Text style={[styles.allClearText, { color: c.dark }]}>No cards due! Check back tomorrow.</Text>
        </View>
      )}

      {/* Methods tried */}
      <Text style={[styles.sectionLabel, { color: c.dark }]}>METHODS TRIED</Text>
      <View style={styles.methodsGrid}>
        {METHODS.map((m) => {
          const tried = !!(state.methodsTried || {})[m.id];
          return (
            <View
              key={m.id}
              style={[
                styles.methodBadge,
                {
                  borderColor: tried ? c.primary : c.borderLight,
                  backgroundColor: tried ? c.purpleLight : c.card,
                },
              ]}>
              <Feather name={m.icon as any} size={14} color={tried ? c.primary : c.muted} />
              <Text style={[styles.methodBadgeText, { color: tried ? c.primary : c.muted }]}>
                {m.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Study dates */}
      {(state.studiedDates || []).length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: c.dark }]}>STUDY DAYS</Text>
          <View style={[styles.card, { borderColor: c.dark }]}>
            <Text style={[styles.studyDayCount, { color: c.dark }]}>
              {state.studiedDates.length} total days studied
            </Text>
            <Text style={[styles.studyDaysSub, { color: c.muted }]}>
              {(state.studiedDates || []).slice(-5).join(' · ')}
            </Text>
          </View>
        </>
      )}

      {/* Empty state */}
      {(state.sessionsFinished || 0) === 0 && (
        <View style={[styles.emptyCard, { borderColor: c.primary }]}>
          <Feather name="bar-chart-2" size={28} color={c.primary} />
          <Text style={[styles.emptyTitle, { color: c.dark }]}>Nothing here yet</Text>
          <Text style={[styles.emptyBody, { color: c.subtle }]}>
            Complete a study session and your progress will show up here.
          </Text>
        </View>
      )}

      {/* Notification settings */}
      <Text style={[styles.sectionLabel, { color: c.dark }]}>DAILY REMINDER</Text>
      <View style={[styles.card, { borderColor: c.dark }]}>
        {/* Toggle row */}
        <View style={styles.notifRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.notifTitle, { color: c.dark }]}>Study reminder</Text>
            <Text style={[styles.notifSub, { color: c.muted }]}>
              {state.notificationsEnabled
                ? `Every day at ${h12}:${minStr} ${ampm}`
                : 'Off — tap to turn on'}
            </Text>
          </View>
          <Switch
            value={!!state.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: c.borderLight, true: c.primary }}
            thumbColor={state.notificationsEnabled ? '#fff' : c.muted}
          />
        </View>

        {/* Time picker (only shown when enabled) */}
        {state.notificationsEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.timePicker}>
              {/* Hours */}
              <View style={styles.timeColumn}>
                <Pressable
                  onPress={() => adjustHour(1)}
                  style={[styles.timeArrow, { borderColor: c.dark }]}>
                  <Text style={[styles.timeArrowText, { color: c.dark }]}>▲</Text>
                </Pressable>
                <View style={[styles.timeDisplay, { borderColor: c.dark, backgroundColor: c.card }]}>
                  <Text style={[styles.timeValue, { color: c.dark }]}>{h12}</Text>
                </View>
                <Pressable
                  onPress={() => adjustHour(-1)}
                  style={[styles.timeArrow, { borderColor: c.dark }]}>
                  <Text style={[styles.timeArrowText, { color: c.dark }]}>▼</Text>
                </Pressable>
              </View>

              <Text style={[styles.timeSep, { color: c.dark }]}>:</Text>

              {/* Minutes */}
              <View style={styles.timeColumn}>
                <Pressable
                  onPress={() => adjustMinute(5)}
                  style={[styles.timeArrow, { borderColor: c.dark }]}>
                  <Text style={[styles.timeArrowText, { color: c.dark }]}>▲</Text>
                </Pressable>
                <View style={[styles.timeDisplay, { borderColor: c.dark, backgroundColor: c.card }]}>
                  <Text style={[styles.timeValue, { color: c.dark }]}>{minStr}</Text>
                </View>
                <Pressable
                  onPress={() => adjustMinute(-5)}
                  style={[styles.timeArrow, { borderColor: c.dark }]}>
                  <Text style={[styles.timeArrowText, { color: c.dark }]}>▼</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => adjustHour(notifHour < 12 ? 12 : -12)}
                style={[styles.ampmBtn, { borderColor: c.dark, backgroundColor: c.card }]}>
                <Text style={[styles.ampmText, { color: c.primary }]}>{ampm}</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleSaveTime}
              style={({ pressed }) => [styles.saveBtn, { borderColor: c.dark, backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[styles.saveBtnText, { color: '#fff' }]}>SAVE TIME</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statBox, { borderColor: c.dark, boxShadow: `4px 4px 0px ${color}` }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  heading: { fontWeight: '900', fontSize: 24, lineHeight: 32 },
  sectionLabel: { fontWeight: '900', fontSize: 10, letterSpacing: 1.5, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, borderWidth: 3, padding: 14, alignItems: 'center', gap: 2,
    boxShadow: '4px 4px 0px #201E2E',
  },
  statValue: { fontWeight: '900', fontSize: 24 },
  statLabel: { fontWeight: '800', fontSize: 9, letterSpacing: 1.5 },
  card: {
    borderWidth: 3, padding: 16, gap: 12,
    boxShadow: '4px 4px 0px #201E2E',
  },
  ptRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ptStat: { alignItems: 'center', gap: 2 },
  ptStatNum: { fontWeight: '900', fontSize: 28 },
  ptStatLabel: { fontWeight: '800', fontSize: 9, letterSpacing: 1.5 },
  barChart: { flexDirection: 'row', height: 60, gap: 4, alignItems: 'flex-end' },
  barWrap: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  barFill: { width: '100%', minHeight: 4, borderWidth: 2, borderRadius: 0 },
  barLabel: { fontSize: 8, fontWeight: '800' },
  missedCard: {
    borderWidth: 3, padding: 12, gap: 10, flexDirection: 'row', alignItems: 'center',
  },
  missedQ: { fontWeight: '800', fontSize: 13, lineHeight: 20 },
  missedA: { fontWeight: '700', fontSize: 12, lineHeight: 18 },
  missedMeta: { fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  gradeButtons: { gap: 6 },
  gradeBtn: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 4 },
  gradeBtnText: { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 0.5 },
  moreLabel: { textAlign: 'center', fontWeight: '700', fontSize: 12 },
  allClearCard: { borderWidth: 2, padding: 20, alignItems: 'center', gap: 8 },
  allClearText: { fontWeight: '800', fontSize: 14, textAlign: 'center' },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodBadge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', gap: 5, alignItems: 'center' },
  methodBadgeText: { fontWeight: '800', fontSize: 11 },
  studyDayCount: { fontWeight: '900', fontSize: 18 },
  studyDaysSub: { fontWeight: '700', fontSize: 12, lineHeight: 18 },
  emptyCard: { borderWidth: 3, borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 10, marginTop: 20 },
  emptyTitle: { fontWeight: '900', fontSize: 16 },
  emptyBody: { fontWeight: '700', fontSize: 13, lineHeight: 20, textAlign: 'center' },

  // Notification settings
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifTitle: { fontWeight: '900', fontSize: 14 },
  notifSub: { fontWeight: '700', fontSize: 12, marginTop: 2 },
  divider: { height: 2, marginVertical: 4 },

  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timeColumn: { alignItems: 'center', gap: 4 },
  timeArrow: { borderWidth: 2, paddingHorizontal: 14, paddingVertical: 6 },
  timeArrowText: { fontWeight: '900', fontSize: 14 },
  timeDisplay: { borderWidth: 3, paddingHorizontal: 18, paddingVertical: 8, minWidth: 60, alignItems: 'center' },
  timeValue: { fontWeight: '900', fontSize: 26, letterSpacing: 1 },
  timeSep: { fontWeight: '900', fontSize: 26, marginBottom: 2 },
  ampmBtn: { borderWidth: 3, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ampmText: { fontWeight: '900', fontSize: 16 },
  saveBtn: { borderWidth: 3, padding: 12, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});
