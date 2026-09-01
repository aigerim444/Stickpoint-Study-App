import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { accountsEnabled } from '@/lib/supabase';
import AccountCard from '@/components/AccountCard';
import ChopCharacter from '@/components/ChopCharacter';
import PixelText from '@/components/PixelText';
import colors from '@/constants/colors';

const c = colors.light;

/**
 * Optional onboarding step between the quiz results and adding material:
 * the student just received their method profile — the moment they first
 * have something worth keeping — so offer to save it. Fully skippable;
 * the Today-tab nudge catches anyone who passes. Signed-in users (and
 * builds without accounts configured) sail straight through.
 */
export default function SaveProgress() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { account } = useApp();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const dest = next === 'tabs' ? '/(tabs)' : '/material';

  const continueOn = () => router.replace(dest as never);

  useEffect(() => {
    // Nothing to offer without accounts; nothing to ask once signed in —
    // a fresh sign-in on this screen advances automatically.
    if (!accountsEnabled || account) continueOn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  if (!accountsEnabled || account) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <ChopCharacter size={1.2} color={c.dark} animation="bounce" />
        <View style={[styles.speechBubble, { borderColor: c.dark }]}>
          <Text style={[styles.speechText, { color: c.dark }]}>
            Your method profile is ready! Want me to keep it safe?
          </Text>
        </View>
        <PixelText style={styles.titlePixel}>SAVE YOUR RESULTS</PixelText>
        <Text style={[styles.tagline, { color: c.subtle }]}>
          Sign in with your email and your methods, streak, and cards follow you to any device. No password — just a code.
        </Text>
      </View>

      <AccountCard startInEmailMode />

      <Pressable
        onPress={continueOn}
        style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}>
        <Text style={[styles.skipText, { color: c.muted }]}>
          Skip for now — keep everything on this device →
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20 },
  header: { alignItems: 'center', gap: 12 },
  speechBubble: {
    backgroundColor: '#fff', borderWidth: 3, paddingHorizontal: 18, paddingVertical: 12,
    maxWidth: 300, boxShadow: '4px 4px 0px #201E2E',
  },
  speechText: { fontWeight: '800', fontSize: 15, textAlign: 'center' },
  titlePixel: { fontSize: 14, lineHeight: 24, textAlign: 'center' },
  tagline: { fontWeight: '700', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 440 },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipText: { fontWeight: '700', fontSize: 14 },
});
