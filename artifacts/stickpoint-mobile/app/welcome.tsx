import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import ChopCharacter from '@/components/ChopCharacter';
import PixelText from '@/components/PixelText';
import colors from '@/constants/colors';
import { scheduleDaily } from '@/lib/notifications';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setName, setNotificationPreference } = useApp();

  // Step 1: name + age
  const [name, setNameInput] = useState('');
  const [age, setAgeInput] = useState('');
  const [error, setError] = useState('');

  // Step 2: notification opt-in
  const [step, setStep] = useState<1 | 2>(1);
  const [notifHour, setNotifHour] = useState(20);   // 8 pm default
  const [notifMinute, setNotifMinute] = useState(0);
  const [timeError, setTimeError] = useState('');

  const c = colors.light;

  // ── Step 1: validate name + age ─────────────────────────────────────────
  const proceedToNotif = () => {
    const trimmed = name.trim();
    const ageNum = parseInt(age, 10);
    if (!trimmed) { setError('What should Chop call you?'); return; }
    if (!ageNum || ageNum < 8 || ageNum > 80) { setError('Enter a valid age (8–80)'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(trimmed, ageNum);
    setStep(2);
  };

  // ── Step 2: schedule notification and finish ─────────────────────────────
  const finishWithReminder = async () => {
    const scheduled = await scheduleDaily(notifHour, notifMinute, 0);
    if (scheduled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNotificationPreference(true, notifHour, notifMinute);
    } else {
      Alert.alert(
        'Permission needed',
        'Notifications were blocked. You can turn them on later in Settings → Daily Reminder.',
        [{ text: 'OK' }],
      );
      setNotificationPreference(false, notifHour, notifMinute);
    }
    router.push('/quiz');
  };

  const finishWithoutReminder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationPreference(false, notifHour, notifMinute);
    router.push('/quiz');
  };

  // ── Time picker helpers ──────────────────────────────────────────────────
  const adjustHour = (delta: number) => {
    setNotifHour((h) => (h + delta + 24) % 24);
    setTimeError('');
  };
  const adjustMinute = (delta: number) => {
    setNotifMinute((m) => (m + delta + 60) % 60);
    setTimeError('');
  };
  const fmt12 = (h: number) => {
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { h12: String(h12), ampm };
  };
  const { h12, ampm } = fmt12(notifHour);
  const minStr = String(notifMinute).padStart(2, '0');

  // ─────────────────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <View style={styles.chopRow}>
            <ChopCharacter size={1.2} color={c.dark} animation="bounce" />
          </View>
          <PixelText style={styles.screenPixel}>DAILY REMINDER</PixelText>
          <Text style={[styles.tagline, { color: c.subtle }]}>A little every day is what sticks.</Text>
        </View>

        <View style={[styles.card, { borderColor: c.dark }]}>
          <Text style={[styles.cardTitle, { color: c.dark }]}>SET A STUDY TIME</Text>
          <Text style={[styles.cardBody, { color: c.subtle }]}>
            Chop will remind you to study every day at this time. You can always change it later.
          </Text>

          {/* Time picker */}
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

            {/* AM/PM */}
            <Pressable
              onPress={() => adjustHour(notifHour < 12 ? 12 : -12)}
              style={[styles.ampmBtn, { borderColor: c.dark, backgroundColor: c.card }]}>
              <Text style={[styles.ampmText, { color: c.primary }]}>{ampm}</Text>
            </Pressable>
          </View>

          {timeError ? <Text style={[styles.error, { color: c.red }]}>{timeError}</Text> : null}

          <Text style={[styles.previewText, { color: c.muted }]}>
            Reminder at {h12}:{minStr} {ampm} every day
          </Text>
        </View>

        <Pressable
          onPress={finishWithReminder}
          style={({ pressed }) => [styles.btn, { backgroundColor: c.accent, borderColor: c.dark, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>REMIND ME DAILY →</Text>
        </Pressable>

        <Pressable
          onPress={finishWithoutReminder}
          style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.skipText, { color: c.muted }]}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled">

        {/* Logo/header */}
        <View style={styles.header}>
          <View style={styles.chopRow}>
            <ChopCharacter size={1.2} color={c.dark} animation="bounce" />
          </View>
          <View style={[styles.speechBubble, { borderColor: c.dark }]}>
            <Text style={[styles.speechText, { color: c.dark }]}>Hey! I'm Chop. Welcome to Stickpoint!</Text>
          </View>
          <PixelText style={styles.logoPixel}>STICKPOINT</PixelText>
          <Text style={[styles.tagline, { color: c.subtle }]}>Find the study method that actually works for YOUR brain.</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { borderColor: c.dark }]}>
          <Text style={[styles.cardTitle, { color: c.dark }]}>BEFORE WE START</Text>
          <Text style={[styles.cardBody, { color: c.subtle }]}>
            Chop needs to know a little about you to personalise your study sessions.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: c.dark }]}>YOUR NAME</Text>
            <TextInput
              style={[styles.input, { borderColor: c.dark, color: c.dark, backgroundColor: c.card }]}
              value={name}
              onChangeText={(t) => { setNameInput(t); setError(''); }}
              placeholder="e.g. Jamie"
              placeholderTextColor={c.muted}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: c.dark }]}>YOUR AGE</Text>
            <TextInput
              style={[styles.input, { borderColor: c.dark, color: c.dark, backgroundColor: c.card }]}
              value={age}
              onChangeText={(t) => { setAgeInput(t.replace(/\D/g, '')); setError(''); }}
              placeholder="e.g. 16"
              placeholderTextColor={c.muted}
              keyboardType="numeric"
              maxLength={3}
              returnKeyType="done"
              onSubmitEditing={proceedToNotif}
            />
          </View>

          {error ? <Text style={[styles.error, { color: c.red }]}>{error}</Text> : null}
        </View>

        <Pressable
          onPress={proceedToNotif}
          style={({ pressed }) => [styles.btn, { backgroundColor: c.accent, borderColor: c.dark, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>LET'S GO →</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20 },
  header: { alignItems: 'center', gap: 12 },
  chopRow: { marginBottom: 4 },
  logoBox: {
    borderWidth: 3, paddingHorizontal: 20, paddingVertical: 8,
    boxShadow: '5px 5px 0px #201E2E',
  },
  logoText: { fontWeight: '900', fontSize: 22, letterSpacing: 4 },
  logoPixel: { fontSize: 22, lineHeight: 33, textAlign: 'center' },
  screenPixel: { fontSize: 14, lineHeight: 24, textAlign: 'center' },
  speechBubble: {
    backgroundColor: '#fff', borderWidth: 3, paddingHorizontal: 18, paddingVertical: 12,
    maxWidth: 280, boxShadow: '4px 4px 0px #201E2E',
  },
  speechText: { fontWeight: '800', fontSize: 15, textAlign: 'center' },
  tagline: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  card: {
    borderWidth: 3, padding: 20, gap: 16,
    boxShadow: '5px 5px 0px #201E2E',
  },
  cardTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 2 },
  cardBody: { fontWeight: '700', fontSize: 14, lineHeight: 22 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  input: { borderWidth: 3, padding: 13, fontSize: 16, fontWeight: '700' },
  error: { fontWeight: '800', fontSize: 13 },
  btn: {
    borderWidth: 3, padding: 16, alignItems: 'center',
    boxShadow: '5px 5px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 16 },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipText: { fontWeight: '700', fontSize: 14 },

  // Time picker
  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timeColumn: { alignItems: 'center', gap: 4 },
  timeArrow: { borderWidth: 2, paddingHorizontal: 14, paddingVertical: 6 },
  timeArrowText: { fontWeight: '900', fontSize: 14 },
  timeDisplay: { borderWidth: 3, paddingHorizontal: 18, paddingVertical: 10, minWidth: 64, alignItems: 'center' },
  timeValue: { fontWeight: '900', fontSize: 28, letterSpacing: 1 },
  timeSep: { fontWeight: '900', fontSize: 28, marginBottom: 2 },
  ampmBtn: { borderWidth: 3, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ampmText: { fontWeight: '900', fontSize: 18 },
  previewText: { fontWeight: '700', fontSize: 12, textAlign: 'center' },
});
