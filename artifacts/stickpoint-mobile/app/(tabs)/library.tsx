import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabContentPadding } from '@/hooks/useTabContentPadding';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

const c = colors.light;

export default function LibraryTab() {
  const insets = useSafeAreaInsets();
  const bottomPad = useTabContentPadding();
  const router = useRouter();
  const { state, switchMaterial, deleteFromLibrary, renameLibraryEntry } = useApp();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const library = state.library || [];

  const startRename = (id: string, current: string) => {
    setRenaming(id);
    setRenameText(current);
  };

  const commitRename = (id: string) => {
    if (renameText.trim()) {
      renameLibraryEntry(id, renameText.trim());
    }
    setRenaming(null);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete material',
      `Remove "${name}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteFromLibrary(id);
          },
        },
      ]
    );
  };

  const switchTo = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchMaterial(id);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: bottomPad }]}>

      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: c.dark }]}>Library</Text>
        <Pressable
          onPress={() => router.push('/material')}
          style={[styles.addBtn, { borderColor: c.dark, backgroundColor: c.primary }]}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={[styles.addBtnText, { color: '#fff' }]}>ADD</Text>
        </Pressable>
      </View>

      {library.length === 0 && (
        <View style={[styles.emptyCard, { borderColor: c.primary }]}>
          <Feather name="book-open" size={28} color={c.primary} />
          <Text style={[styles.emptyTitle, { color: c.dark }]}>No material saved</Text>
          <Text style={[styles.emptyBody, { color: c.subtle }]}>
            Tap ADD to paste your notes and let Chop build your study set.
          </Text>
          <Pressable
            onPress={() => router.push('/material')}
            style={[styles.emptyBtn, { backgroundColor: c.primary, borderColor: c.dark }]}>
            <Text style={[styles.emptyBtnText, { color: '#fff' }]}>ADD NOTES</Text>
          </Pressable>
        </View>
      )}

      {library.map((entry) => {
        const isCurrent = entry.id === state.currentMaterialId;
        return (
          <View
            key={entry.id}
            style={[
              styles.entryCard,
              {
                borderColor: isCurrent ? c.primary : c.dark,
                backgroundColor: isCurrent ? c.purpleLight : c.card,
                boxShadow: isCurrent ? `3px 3px 0px ${c.primary}` : `3px 3px 0px ${c.dark}`,
              },
            ]}>
            {/* Title row */}
            <View style={styles.entryHeader}>
              {renaming === entry.id ? (
                <TextInput
                  style={[styles.renameInput, { borderColor: c.dark, color: c.dark, backgroundColor: '#fff' }]}
                  value={renameText}
                  onChangeText={setRenameText}
                  onSubmitEditing={() => commitRename(entry.id)}
                  onBlur={() => commitRename(entry.id)}
                  autoFocus
                  returnKeyType="done"
                />
              ) : (
                <Text style={[styles.entryName, { color: c.dark }]} numberOfLines={1}>
                  {entry.name}
                </Text>
              )}
              {isCurrent && (
                <View style={[styles.activeBadge, { backgroundColor: c.primary, borderColor: c.dark }]}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            {/* Meta */}
            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { borderColor: c.borderLight }]}>
                <Feather name="layers" size={11} color={c.muted} />
                <Text style={[styles.metaText, { color: c.muted }]}>{entry.concepts?.length || 0} cards</Text>
              </View>
              {entry.isMath && (
                <View style={[styles.metaChip, { borderColor: c.borderLight }]}>
                  <Feather name="cpu" size={11} color={c.muted} />
                  <Text style={[styles.metaText, { color: c.muted }]}>math</Text>
                </View>
              )}
              <Text style={[styles.metaDate, { color: c.muted }]}>
                {new Date(entry.savedAt).toLocaleDateString()}
              </Text>
            </View>

            {/* Notes preview */}
            {entry.material && (
              <Text style={[styles.notePreview, { color: c.subtle }]} numberOfLines={2}>
                {entry.material.slice(0, 120)}...
              </Text>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              {!isCurrent && (
                <Pressable
                  onPress={() => switchTo(entry.id)}
                  style={[styles.actionBtn, { backgroundColor: c.primary, borderColor: c.dark }]}>
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>STUDY THIS</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => startRename(entry.id, entry.name)}
                style={[styles.actionBtnIcon, { borderColor: c.dark }]}>
                <Feather name="edit-2" size={14} color={c.dark} />
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(entry.id, entry.name)}
                style={[styles.actionBtnIcon, { borderColor: c.red }]}>
                <Feather name="trash-2" size={14} color={c.red} />
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontWeight: '900', fontSize: 24, lineHeight: 32 },
  addBtn: {
    borderWidth: 3, flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    boxShadow: '3px 3px 0px #201E2E',
  },
  addBtnText: { fontWeight: '900', fontSize: 13 },
  entryCard: {
    borderWidth: 3, padding: 14, gap: 10,
    boxShadow: '4px 4px 0px #201E2E',
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  entryName: { fontWeight: '900', fontSize: 15, flex: 1 },
  renameInput: { flex: 1, borderWidth: 2, padding: 6, fontSize: 14, fontWeight: '700' },
  activeBadge: { borderWidth: 2, paddingHorizontal: 6, paddingVertical: 2 },
  activeBadgeText: { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaChip: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', gap: 3, alignItems: 'center' },
  metaText: { fontSize: 11, fontWeight: '700' },
  metaDate: { fontSize: 11, fontWeight: '700', marginLeft: 'auto' },
  notePreview: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { flex: 1, borderWidth: 3, padding: 9, alignItems: 'center' },
  actionBtnText: { fontWeight: '900', fontSize: 12 },
  actionBtnIcon: { borderWidth: 2, padding: 9 },
  emptyCard: { borderWidth: 3, borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 10, marginTop: 20 },
  emptyTitle: { fontWeight: '900', fontSize: 16 },
  emptyBody: { fontWeight: '700', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  emptyBtn: { borderWidth: 3, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
    boxShadow: '4px 4px 0px #201E2E',
  },
  emptyBtnText: { fontWeight: '900', fontSize: 14 },
});
