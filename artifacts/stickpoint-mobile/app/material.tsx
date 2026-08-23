import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/context/AppContext';
import ChopCharacter from '@/components/ChopCharacter';
import { extractConcepts, transcribeMaterial, TranscribeMediaType } from '@/lib/api';
import colors from '@/constants/colors';

type Phase = 'input' | 'transcribing' | 'processing' | 'error';

export default function Material() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setMaterial } = useApp();
  const [notes, setNotes] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [errorMsg, setErrorMsg] = useState('');

  const c = colors.light;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to import images of your notes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    const base64 = asset?.base64;
    if (!asset || !base64) return;
    const mediaType: TranscribeMediaType =
      asset.mimeType === 'image/png' ? 'image/png'
      : asset.mimeType === 'image/webp' ? 'image/webp'
      : 'image/jpeg';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('transcribing');
    const text = await transcribeMaterial(base64, mediaType, { name: state.name, age: state.age });
    if (!text) {
      setErrorMsg("Chop couldn't read that photo. Try a clearer, well-lit shot straight over the page — or type the notes instead.");
      setPhase('error');
      return;
    }
    // Drop the transcription into the editor so the student can check and
    // fix it before Chop builds cards from it.
    setNotes((prev) => (prev.trim() ? prev.trimEnd() + '\n\n' + text : text));
    setPhase('input');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const process = async () => {
    const trimmed = notes.trim();
    if (trimmed.length < 30) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('processing');
    const result = await extractConcepts(trimmed, state.name, state.age);
    if (!result) {
      setErrorMsg("Chop couldn't read those notes. Make sure there's enough content and try again.");
      setPhase('error');
      return;
    }
    setMaterial(trimmed, result.topic, result.cards, result.isMath);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  if (phase === 'processing' || phase === 'transcribing') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: c.background, paddingTop: insets.top }]}>
        <ChopCharacter size={1.4} color={c.primary} animation="bounce" />
        <View style={styles.processingBox}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.processingTitle, { color: c.dark }]}>
            {phase === 'transcribing' ? 'CHOP IS READING YOUR PHOTO…' : 'CHOP IS READING…'}
          </Text>
          <Text style={[styles.processingBody, { color: c.subtle }]}>
            {phase === 'transcribing'
              ? 'Turning the photo into text you can check and edit.'
              : 'Building your flashcards, questions, and study plan.'}
          </Text>
        </View>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: c.background, padding: 24, paddingTop: insets.top }]}>
        <ChopCharacter size={1.2} color={c.red} animation="tilt" />
        <Text style={[styles.errorTitle, { color: c.red }]}>SOMETHING WENT WRONG</Text>
        <Text style={[styles.errorBody, { color: c.subtle }]}>{errorMsg}</Text>
        <Pressable onPress={() => setPhase('input')} style={[styles.btn, { backgroundColor: c.primary, borderColor: c.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>TRY AGAIN</Text>
        </Pressable>
      </View>
    );
  }

  const isReady = notes.trim().length >= 30;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled">

        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: c.muted }]}>HEY {state.name?.toUpperCase()}</Text>
            <Text style={[styles.heading, { color: c.dark }]}>Paste your notes</Text>
          </View>
          <ChopCharacter size={0.9} color={c.primary} animation="bounce" />
        </View>

        <Text style={[styles.body, { color: c.subtle }]}>
          Paste your class notes, a textbook excerpt, or any study material. The more detail, the better Chop can help.
        </Text>

        <Pressable onPress={pickPhoto} style={[styles.photoBtn, { borderColor: c.dark, backgroundColor: c.card }]}>
          <Text style={[styles.photoBtnText, { color: c.dark }]}>📷  Import photo of notes</Text>
        </Pressable>

        <TextInput
          style={[styles.noteInput, { borderColor: c.dark, color: c.dark, backgroundColor: c.card }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder={`Paste or type your notes here...\n\nExample:\n- Mitosis is cell division that produces two identical daughter cells\n- Phases: prophase, metaphase, anaphase, telophase\n- Used for growth and repair, not reproduction`}
          placeholderTextColor={c.muted}
          textAlignVertical="top"
          autoFocus
        />

        <Text style={[styles.charCount, { color: notes.length >= 30 ? c.green : c.muted }]}>
          {notes.length >= 30 ? `${notes.length} chars — ready!` : `${notes.length}/30 chars minimum`}
        </Text>

        <Pressable
          onPress={process}
          disabled={!isReady}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: isReady ? c.primary : c.secondary, borderColor: c.dark, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[styles.btnText, { color: isReady ? '#fff' : c.muted }]}>LET CHOP ANALYSE →</Text>
        </Pressable>

        {state.library && state.library.length > 0 && (
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipLink}>
            <Text style={[styles.skipText, { color: c.muted }]}>skip — use existing material</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 20 },
  container: { padding: 20, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  greeting: { fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  heading: { fontWeight: '900', fontSize: 24, lineHeight: 32, marginTop: 2 },
  body: { fontWeight: '700', fontSize: 14, lineHeight: 22 },
  photoBtn: {
    borderWidth: 2, borderStyle: 'dashed', padding: 14, alignItems: 'center',
  },
  photoBtnText: { fontWeight: '800', fontSize: 13 },
  noteInput: {
    borderWidth: 3, padding: 14, fontSize: 15, fontWeight: '600',
    minHeight: 220, lineHeight: 24,
  },
  charCount: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  btn: {
    borderWidth: 3, padding: 16, alignItems: 'center',
    boxShadow: '5px 5px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  skipLink: { alignSelf: 'center', paddingVertical: 4 },
  skipText: { fontWeight: '700', fontSize: 12 },
  processingBox: { alignItems: 'center', gap: 10, marginTop: 24, paddingHorizontal: 40 },
  processingTitle: { fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  processingBody: { fontWeight: '700', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  errorTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 1, marginTop: 8 },
  errorBody: { fontWeight: '700', fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 300 },
});
