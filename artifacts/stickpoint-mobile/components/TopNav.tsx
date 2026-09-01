import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import PixelText from '@/components/PixelText';
import colors from '@/constants/colors';

const c = colors.light;

const TABS = [
  { path: '/today', label: 'TODAY', icon: 'sun' },
  { path: '/', label: 'STUDY', icon: 'zap' },
  { path: '/plan', label: 'PLAN', icon: 'calendar' },
  { path: '/progress', label: 'PROGRESS', icon: 'bar-chart-2' },
  { path: '/library', label: 'LIBRARY', icon: 'book' },
] as const;

const TAB_PATHS: string[] = TABS.map((t) => t.path);

/**
 * Desktop-web navigation: a top bar inside the frame (logo · tabs ·
 * streak/XP), replacing the bottom tab bar at wide widths — bottom tabs
 * are a phone convention; eyes live at the top on a laptop. Rendered by
 * WebFrame only on wide web, and only on the tab routes.
 */
export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useApp();

  if (!TAB_PATHS.includes(pathname)) return null;

  return (
    <View style={[styles.bar, { borderBottomColor: c.dark }]}>
      <View style={styles.logoRow}>
        <PixelText style={styles.logo}>STICKPOINT</PixelText>
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = pathname === t.path;
          return (
            <Pressable
              key={t.path}
              onPress={() => router.navigate(t.path as never)}
              style={[styles.tab, active && { backgroundColor: c.dark }]}>
              <Feather name={t.icon as never} size={14} color={active ? '#fff' : c.dark} />
              <Text style={[styles.tabText, { color: active ? '#fff' : c.dark }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.chips}>
        <View style={[styles.chip, { borderColor: c.dark }]}>
          <Text style={styles.chipText}>🔥 {state.streak || 0}</Text>
        </View>
        <View style={[styles.chip, { borderColor: c.dark }]}>
          <Text style={styles.chipText}>⭐ {state.xp || 0}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFCF6',
    borderBottomWidth: 3,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { fontSize: 13, lineHeight: 20 },
  tabs: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  tabText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 2, paddingVertical: 4, paddingHorizontal: 9, backgroundColor: '#fff' },
  chipText: { fontWeight: '900', fontSize: 12, color: '#201E2E' },
});
