import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp, useEffectiveMethods } from '@/context/AppContext';
import { getMethodById } from '@/lib/content';
import colors from '@/constants/colors';

const c = colors.light;

/**
 * The prototype's "YOUR TOP 3 METHODS" editor: reorder, remove, and add
 * methods to the top-3 that lead the Study tab — saved per material
 * (materialTopMethods), exactly like the original's _saveTop3 flow.
 */
export default function TopMethodsEditor() {
  const { state, setMaterialTopMethods } = useApp();
  const effectiveMethods = useEffectiveMethods(state);

  const top3 = (state.materialTopMethods ?? state.topMethods).slice(0, 3);
  const rest = effectiveMethods.filter((id) => !top3.includes(id));

  const save = (next: string[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMaterialTopMethods(next);
  };
  const moveUp = (i: number) => {
    if (i <= 0) return;
    const next = [...top3];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    save(next);
  };
  const moveDown = (i: number) => {
    if (i >= top3.length - 1) return;
    const next = [...top3];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    save(next);
  };
  const remove = (i: number) => save(top3.filter((_, j) => j !== i));
  const add = (id: string) => {
    if (top3.length >= 3 || top3.includes(id)) return;
    save([...top3, id]);
  };

  return (
    <View style={{ gap: 10 }}>
      <Text style={[styles.hint, { color: c.muted }]}>
        These lead your Study tab. Reorder or swap them to match what's working — saved separately for each study set.
      </Text>
      {top3.map((id, i) => {
        const m = getMethodById(id);
        if (!m) return null;
        return (
          <View key={id} style={[styles.row, { borderColor: c.dark }]}>
            <Text style={[styles.rank, { color: c.accent }]}>#{i + 1}</Text>
            <Text style={[styles.name, { color: c.dark }]}>{m.label}</Text>
            <Pressable onPress={() => moveUp(i)} disabled={i === 0} style={[styles.iconBtn, { borderColor: c.dark, opacity: i === 0 ? 0.3 : 1 }]}>
              <Text style={styles.iconText}>↑</Text>
            </Pressable>
            <Pressable onPress={() => moveDown(i)} disabled={i === top3.length - 1} style={[styles.iconBtn, { borderColor: c.dark, opacity: i === top3.length - 1 ? 0.3 : 1 }]}>
              <Text style={styles.iconText}>↓</Text>
            </Pressable>
            <Pressable onPress={() => remove(i)} style={[styles.iconBtn, { borderColor: c.red }]}>
              <Text style={[styles.iconText, { color: c.red }]}>✕</Text>
            </Pressable>
          </View>
        );
      })}
      {top3.length < 3 && rest.length > 0 && (
        <>
          <Text style={[styles.addLabel, { color: c.muted }]}>TAP TO ADD TO TOP 3:</Text>
          <View style={styles.addRow}>
            {rest.map((id) => {
              const m = getMethodById(id);
              if (!m) return null;
              return (
                <Pressable key={id} onPress={() => add(id)} style={[styles.addChip, { borderColor: c.dark }]}>
                  <Text style={[styles.addChipText, { color: c.dark }]}>+ {m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, fontWeight: '700', lineHeight: 18 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 2.5, padding: 12, backgroundColor: '#fff',
  },
  rank: { fontWeight: '900', fontSize: 13 },
  name: { flex: 1, fontWeight: '800', fontSize: 14 },
  iconBtn: { borderWidth: 2, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontWeight: '900', fontSize: 14, color: '#201E2E' },
  addLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addChip: { borderWidth: 2, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#fff' },
  addChipText: { fontWeight: '800', fontSize: 12 },
});
