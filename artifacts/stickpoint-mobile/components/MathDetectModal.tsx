import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PixelText from '@/components/PixelText';
import { getMethodById } from '@/lib/content';
import colors from '@/constants/colors';

const c = colors.light;

/** The prototype's "I DETECT SOME MATH" offer, ported: when extraction
 * flags the material as math, offer to swap this material's top 3 to the
 * methods that actually work for procedural subjects. */
export const MATH_TOP3 = ['problem_sets', 'practice_testing', 'active_recall'];

export default function MathDetectModal({
  visible,
  onChoose,
}: {
  visible: boolean;
  /** true = set the math top 3 for this material; false = keep quiz results. */
  onChoose: (useMathTop3: boolean) => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => onChoose(false)}>
      <View style={styles.backdrop}>
        <ScrollView
          style={[styles.card, { borderColor: c.dark }]}
          contentContainerStyle={styles.cardContent}>
          <PixelText style={[styles.titlePixel, { color: c.accent }]}>I DETECT SOME MATH</PixelText>
          <Text style={[styles.heading, { color: c.dark }]}>There's math in your notes!</Text>
          <Text style={[styles.body, { color: c.subtle }]}>
            Math is about practising moves, not memorising facts. These three methods are built for
            it — want to switch your top 3 for this study set?
          </Text>

          {MATH_TOP3.map((id, i) => {
            const m = getMethodById(id);
            if (!m) return null;
            return (
              <View key={id} style={[styles.methodCard, { borderColor: c.dark }]}>
                <View style={[styles.rankBadge, { backgroundColor: c.accent, borderColor: c.dark }]}>
                  <PixelText style={styles.rankText}>#{i + 1}</PixelText>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.methodName, { color: c.dark }]}>{m.label}</Text>
                  <Text style={[styles.methodWhy, { color: c.subtle }]}>{m.whyWorks}</Text>
                </View>
              </View>
            );
          })}

          <Pressable
            onPress={() => onChoose(true)}
            style={[styles.yesBtn, { backgroundColor: c.accent, borderColor: c.dark }]}>
            <Text style={styles.yesText}>YES — SET THESE AS MY TOP 3 →</Text>
          </Pressable>
          <Pressable onPress={() => onChoose(false)} style={[styles.noBtn, { borderColor: c.borderLight }]}>
            <Text style={[styles.noText, { color: c.muted }]}>No thanks, keep my quiz results</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(32, 30, 46, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFCF6',
    borderWidth: 3,
    boxShadow: '6px 6px 0px #201E2E',
    flexGrow: 0,
  },
  cardContent: { padding: 20, gap: 12 },
  titlePixel: { fontSize: 13, lineHeight: 22, textAlign: 'center' },
  heading: { fontSize: 19, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 14, fontWeight: '700', lineHeight: 21, textAlign: 'center' },
  methodCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 3, padding: 14, backgroundColor: '#fff',
  },
  rankBadge: { borderWidth: 2, paddingVertical: 6, paddingHorizontal: 7 },
  rankText: { fontSize: 10, lineHeight: 14, color: '#fff' },
  methodName: { fontSize: 16, fontWeight: '900' },
  methodWhy: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  yesBtn: {
    borderWidth: 3, padding: 15, alignItems: 'center', marginTop: 4,
    boxShadow: '4px 4px 0px #201E2E',
  },
  yesText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  noBtn: { borderWidth: 2, padding: 12, alignItems: 'center' },
  noText: { fontWeight: '800', fontSize: 13 },
});
