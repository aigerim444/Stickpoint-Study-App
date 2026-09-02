import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';

/**
 * Privacy policy. DRAFT — the team must review (and add a real contact
 * address) before public launch. Written to be readable by the students
 * it applies to, not just their parents.
 */

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'The short version',
    body:
      "Stickpoint helps you study. To do that it needs your notes and a little about you. We collect as little as possible, we never sell it, there are no ads and no trackers, and you can export or delete everything, any time.",
  },
  {
    title: 'What we collect',
    body:
      'Your first name and age (so explanations match your level). The study material you add. Your study progress: cards, scores, streaks, missed questions. If you create an account: your email address. That is the whole list. We never ask for your full name, school, address, or phone number.',
  },
  {
    title: 'Where it lives',
    body:
      'Without an account, everything stays on your device — we cannot see it. With an account, your progress is stored on our servers so you can switch devices without losing it.',
  },
  {
    title: 'AI processing',
    body:
      'When Stickpoint builds flashcards, grades an explanation, or reads a photo of your notes, that content is processed by Anthropic (the company behind the Claude AI) under their commercial terms. Your material is used to answer your request — not to train AI models.',
  },
  {
    title: 'What we will never do',
    body:
      'Sell your data. Show you ads. Put your scores or streaks where other people can see them. Message you except for the study reminder you set yourself.',
  },
  {
    title: 'Your rights',
    body:
      'Export everything we hold about you as a file (Progress tab → Export my data). Delete your account and all synced data permanently, in the app, no email required (Progress tab → Delete my account). Deletion is immediate and irreversible.',
  },
  {
    title: 'Analytics',
    body:
      'We count anonymous product events (like "a quiz was completed") to learn whether Stickpoint actually helps people study. No advertising identifiers, no third-party trackers, no fingerprinting.',
  },
  {
    title: 'Questions',
    body:
      'Contact the team: [add contact email before launch]. If we change this policy, the app will tell you before the change applies.',
  },
];

export default function Privacy() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = colors.light;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/progress' as never))} style={styles.backRow}>
        <Feather name="arrow-left" size={16} color={c.muted} />
        <Text style={[styles.backText, { color: c.muted }]}>back</Text>
      </Pressable>
      <Text style={[styles.heading, { color: c.dark }]}>Privacy, plainly</Text>
      {SECTIONS.map((s) => (
        <View key={s.title} style={[styles.card, { borderColor: c.dark }]}>
          <Text style={[styles.title, { color: c.primary }]}>{s.title.toUpperCase()}</Text>
          <Text style={[styles.body, { color: c.dark }]}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 13, fontWeight: '700' },
  heading: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
  card: { borderWidth: 2.5, padding: 14, gap: 6, backgroundColor: '#fff' },
  title: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  body: { fontSize: 14, fontWeight: '600', lineHeight: 21 },
});
