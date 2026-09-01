import React, { useCallback, useEffect, useState } from 'react';
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
import PixelText from '@/components/PixelText';
import { extractConcepts, transcribeMaterial, TranscribeMediaType } from '@/lib/api';
import colors from '@/constants/colors';
import { SAMPLE_CARDS, SAMPLE_MATERIAL, SAMPLE_TOPIC } from '@/lib/sampleMaterial';

type Phase = 'input' | 'transcribing' | 'processing' | 'error';

export default function Material() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setMaterial } = useApp();
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'paste' | 'pdf' | 'photo'>('paste');
  const [etaLeft, setEtaLeft] = useState(0);
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
    // The transcription lands in the editor so the student can check and
    // fix it before Chop builds cards from it.
    await importTranscribable(base64, mediaType);
  };

  const [dragging, setDragging] = useState(false);

  const pickFile = (accept?: string) => {
    if (Platform.OS !== 'web') {
      pickPhoto();
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || 'image/png,image/jpeg,image/webp,application/pdf,text/plain,.txt,.md';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) handleDroppedFile(f);
    };
    input.click();
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const importTranscribable = useCallback(
    async (base64: string, mediaType: TranscribeMediaType) => {
      setPhase('transcribing');
      const result = await transcribeMaterial(base64, mediaType, { name: state.name, age: state.age });
      if (!result.ok) {
        setErrorMsg(
          result.reason === 'unavailable'
            ? "Chop's AI isn't reachable right now — the file is probably fine. Check your connection (or, if this is a preview build, the AI server isn't set up). You can still paste or type the notes."
            : "Chop couldn't read that file. Try a clearer, well-lit photo or a text-based PDF — or paste the notes instead.",
        );
        setPhase('error');
        return;
      }
      setNotes((prev) => (prev.trim() ? prev.trimEnd() + '\n\n' + result.text : result.text));
      setMode('paste');
      setPhase('input');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [state.name, state.age],
  );

  /** Web: a file dropped anywhere on the screen becomes notes. */
  const handleDroppedFile = useCallback(
    async (file: File) => {
      const type = file.type || '';
      const name = file.name.toLowerCase();
      const isText =
        type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md');
      if (isText) {
        const text = (await file.text()).trim();
        if (text) setNotes((prev) => (prev.trim() ? prev.trimEnd() + '\n\n' + text : text));
        return;
      }
      const mediaType: TranscribeMediaType | null =
        type === 'image/png' ? 'image/png'
        : type === 'image/jpeg' ? 'image/jpeg'
        : type === 'image/webp' ? 'image/webp'
        : type === 'application/pdf' || name.endsWith('.pdf') ? 'application/pdf'
        : null;
      if (!mediaType) {
        notify('File type not supported', 'Drop a photo (PNG/JPG), a PDF, or a text file — or just paste the notes.');
        return;
      }
      if (file.size > 3_300_000) {
        notify('File too big', 'Keep it under ~3 MB — try fewer pages at a time, or a smaller photo.');
        return;
      }
      const base64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const comma = result.indexOf(',');
          resolve(comma >= 0 ? result.slice(comma + 1) : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      if (!base64) {
        notify('Could not read that file', 'Try again, or paste the notes instead.');
        return;
      }
      await importTranscribable(base64, mediaType);
    },
    [importTranscribable],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let depth = 0;
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      depth++;
      setDragging(true);
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleDroppedFile(file);
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleDroppedFile]);

  const process = async () => {
    const trimmed = notes.trim();
    if (trimmed.length < 30) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('processing');
    setEtaLeft(50);
    const tick = setInterval(() => setEtaLeft((t) => Math.max(0, t - 1)), 1000);
    setTimeout(() => clearInterval(tick), 120_000);
    const outcome = await extractConcepts(trimmed, state.name, state.age);
    if (!outcome.ok) {
      setErrorMsg(
        outcome.reason === 'rate_limited'
          ? "Chop's a little overwhelmed — you've made a lot of requests in a row. Your notes are fine; wait a minute and try again."
          : outcome.reason === 'unavailable'
            ? "Chop's AI isn't reachable right now — your notes are fine. Check your connection and try again in a moment."
            : "Chop couldn't turn those notes into cards. Try adding a bit more detail, then try again.",
      );
      setPhase('error');
      return;
    }
    const result = outcome.result;
    setMaterial(trimmed, result.topic, result.cards, result.isMath);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  if (phase === 'processing' || phase === 'transcribing') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: c.background, paddingTop: insets.top }]}>
        <ChopCharacter size={1.4} color={c.dark} animation="bounce" />
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
          {phase === 'processing' && (
            <>
              <View style={[styles.etaBar, { borderColor: c.dark, backgroundColor: c.secondary }]}>
                <View style={[styles.etaFill, { width: `${Math.min(100, ((50 - etaLeft) / 50) * 100)}%`, backgroundColor: c.primary }]} />
              </View>
              <Text style={[styles.etaText, { color: c.primary }]}>
                {etaLeft > 0 ? `about ${etaLeft} seconds left` : 'almost there…'}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: c.background, padding: 24, paddingTop: insets.top }]}>
        <ChopCharacter size={1.2} color={c.dark} animation="tilt" />
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
            <PixelText style={styles.headingPixel}>PASTE YOUR NOTES</PixelText>
          </View>
          <ChopCharacter size={0.9} color={c.dark} animation="bounce" />
        </View>

        <Text style={[styles.body, { color: c.subtle }]}>
          Paste your class notes, a textbook excerpt, or any study material. The more detail, the better Chop can help.
        </Text>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMaterial(SAMPLE_MATERIAL, SAMPLE_TOPIC, SAMPLE_CARDS, false);
            router.replace('/(tabs)');
          }}
          style={[styles.sampleBtn, { borderColor: c.dark, backgroundColor: c.purpleLight }]}>
          <Text style={[styles.sampleBtnText, { color: c.dark }]}>
            🧪 Just looking? Try a sample: Easy Chemistry
          </Text>
        </Pressable>

        {/* Mode tabs — the prototype's PASTE TEXT / PDF / PHOTO */}
        <View style={styles.modeRow}>
          {([['paste', '✍️ PASTE TEXT'], ['pdf', '📄 PDF'], ['photo', '📷 PHOTO']] as const).map(([m, label]) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.modeTab,
                { borderColor: c.dark, backgroundColor: mode === m ? c.primary : c.card },
              ]}>
              <Text style={[styles.modeTabText, { color: mode === m ? '#fff' : c.dark }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'paste' && (
          <TextInput
            style={[styles.noteInput, { borderColor: c.dark, color: c.dark, backgroundColor: c.card }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={`Paste or type your notes here...\n\nExample:\n- Mitosis is cell division that produces two identical daughter cells\n- Phases: prophase, metaphase, anaphase, telophase\n- Used for growth and repair, not reproduction`}
            placeholderTextColor={c.muted}
            textAlignVertical="top"
          />
        )}
        {mode === 'pdf' && (
          <View style={[styles.dropCard, { borderColor: c.dark, backgroundColor: c.card }]}>
            <Text style={styles.dropEmojiSm}>📄</Text>
            <Text style={[styles.dropStatus, { color: c.subtle }]}>
              {notes.trim() ? `${notes.length} characters ready — check them in Paste Text` : 'No PDF chosen yet'}
            </Text>
            <Text style={[styles.dropHint, { color: c.muted }]}>
              Chop reads the pages and turns them into editable text first.
            </Text>
            <Pressable
              onPress={() => (Platform.OS === 'web' ? pickFile('application/pdf,.pdf') : notify('Coming soon', 'PDF import arrives with the phone app — use the website for now.'))}
              style={[styles.chooseBtn, { backgroundColor: c.primary, borderColor: c.dark }]}>
              <Text style={styles.chooseBtnText}>CHOOSE PDF</Text>
            </Pressable>
          </View>
        )}
        {mode === 'photo' && (
          <View style={[styles.dropCard, { borderColor: c.dark, backgroundColor: c.card }]}>
            <Text style={styles.dropEmojiSm}>📷</Text>
            <Text style={[styles.dropStatus, { color: c.subtle }]}>
              {notes.trim() ? `${notes.length} characters ready — check them in Paste Text` : 'No photo chosen yet'}
            </Text>
            <Text style={[styles.dropHint, { color: c.muted }]}>
              Snap your handwritten notes or a textbook page — Chop will read the text off it.
            </Text>
            <Pressable
              onPress={() => (Platform.OS === 'web' ? pickFile('image/png,image/jpeg,image/webp') : pickPhoto())}
              style={[styles.chooseBtn, { backgroundColor: c.primary, borderColor: c.dark }]}>
              <Text style={styles.chooseBtnText}>CHOOSE PHOTO</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.charCount, { color: notes.length >= 30 ? c.green : c.muted }]}>
          {notes.length >= 30 ? `${notes.length} chars — ready!` : `${notes.length}/30 chars minimum`}
        </Text>

        <Pressable
          onPress={process}
          disabled={!isReady}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: isReady ? c.accent : c.secondary, borderColor: c.dark, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[styles.btnText, { color: isReady ? '#fff' : c.muted }]}>LET CHOP ANALYSE →</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipLink}>
          <Text style={[styles.skipText, { color: c.muted }]}>
            {state.library && state.library.length > 0 ? 'skip — use existing material' : 'skip for now — look around first'}
          </Text>
        </Pressable>
      </ScrollView>
      {dragging && (
        <View style={[styles.dropOverlay, { borderColor: c.primary }]} pointerEvents="none">
          <Text style={styles.dropEmoji}>📄</Text>
          <Text style={[styles.dropTitle, { color: c.primary }]}>Drop it!</Text>
          <Text style={[styles.dropSub, { color: c.dark }]}>Photo, PDF, or text file — Chop will read it.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 8 },
  modeTab: { flex: 1, borderWidth: 3, paddingVertical: 11, alignItems: 'center' },
  modeTabText: { fontWeight: '900', fontSize: 12 },
  dropCard: {
    borderWidth: 3, borderStyle: 'dashed', padding: 26, alignItems: 'center', gap: 8,
    minHeight: 220, justifyContent: 'center',
  },
  dropEmojiSm: { fontSize: 32 },
  dropStatus: { fontWeight: '800', fontSize: 13, textAlign: 'center' },
  dropHint: { fontWeight: '700', fontSize: 11, textAlign: 'center', maxWidth: 260, lineHeight: 16 },
  chooseBtn: {
    borderWidth: 3, paddingVertical: 11, paddingHorizontal: 22, marginTop: 4,
    boxShadow: '3px 3px 0px #201E2E',
  },
  chooseBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  etaBar: { width: 260, height: 14, borderWidth: 2, overflow: 'hidden', marginTop: 10 },
  etaFill: { height: '100%' },
  etaText: { fontWeight: '800', fontSize: 13, marginTop: 6 },
  sampleBtn: {
    borderWidth: 2.5, padding: 13, alignItems: 'center',
    boxShadow: '3px 3px 0px #201E2E',
  },
  sampleBtnText: { fontWeight: '800', fontSize: 13 },
  headingPixel: { fontSize: 13, lineHeight: 22, marginTop: 4 },
  dropOverlay: {
    position: 'absolute', top: 12, left: 12, right: 12, bottom: 12,
    borderWidth: 4, borderStyle: 'dashed',
    backgroundColor: 'rgba(251, 232, 211, 0.94)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  dropEmoji: { fontSize: 44 },
  dropTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  dropSub: { fontSize: 14, fontWeight: '700' },
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
