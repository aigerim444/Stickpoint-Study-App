import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import ChopCharacter from '@/components/ChopCharacter';
import colors from '@/constants/colors';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setName } = useApp();
  const [name, setNameInput] = useState('');
  const [age, setAgeInput] = useState('');
  const [error, setError] = useState('');

  const proceed = () => {
    const trimmed = name.trim();
    const ageNum = parseInt(age, 10);
    if (!trimmed) { setError('What should Chop call you?'); return; }
    if (!ageNum || ageNum < 8 || ageNum > 80) { setError('Enter a valid age (8–80)'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(trimmed, ageNum);
    router.push('/quiz');
  };

  const c = colors.light;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled">

        {/* Logo/header */}
        <View style={styles.header}>
          <View style={styles.chopRow}>
            <ChopCharacter size={1.2} color={c.primary} animation="bounce" />
          </View>
          <View style={[styles.logoBox, { borderColor: c.dark }]}>
            <Text style={[styles.logoText, { color: c.dark }]}>STICKPOINT</Text>
          </View>
          <Text style={[styles.tagline, { color: c.subtle }]}>Study smarter. Remember longer.</Text>
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
              onSubmitEditing={proceed}
            />
          </View>

          {error ? <Text style={[styles.error, { color: c.red }]}>{error}</Text> : null}
        </View>

        <Pressable
          onPress={proceed}
          style={({ pressed }) => [styles.btn, { backgroundColor: c.primary, borderColor: c.dark, opacity: pressed ? 0.85 : 1 }]}>
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
    ...Platform.select({ ios: { shadowColor: '#201E2E', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 }, android: { elevation: 4 } }),
  },
  logoText: { fontWeight: '900', fontSize: 22, letterSpacing: 4 },
  tagline: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  card: {
    borderWidth: 3, padding: 20, gap: 16,
    ...Platform.select({ ios: { shadowColor: '#201E2E', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 }, android: { elevation: 4 } }),
  },
  cardTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 2 },
  cardBody: { fontWeight: '700', fontSize: 14, lineHeight: 22 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  input: { borderWidth: 3, padding: 13, fontSize: 16, fontWeight: '700' },
  error: { fontWeight: '800', fontSize: 13 },
  btn: {
    borderWidth: 3, padding: 16, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#201E2E', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 }, android: { elevation: 4 } }),
  },
  btnText: { fontWeight: '900', fontSize: 16 },
});
