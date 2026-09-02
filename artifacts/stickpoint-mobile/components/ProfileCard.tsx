import React, { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

const c = colors.light;

const SHARE_MESSAGE =
  "I've been studying with Stickpoint — it finds the study method that actually works for your brain. Free to use: https://stickpoint-study.vercel.app";

/**
 * The prototype's ME-tab essentials: edit name & age (Chop pitches
 * explanations by age), study sounds, replay the tour, share Stickpoint.
 */
export default function ProfileCard() {
  const { state, setName, setSoundOn, setTourSeen } = useApp();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.name);
  const [ageDraft, setAgeDraft] = useState(state.age ? String(state.age) : '');
  const [shared, setShared] = useState(false);

  const saveProfile = () => {
    const n = nameDraft.trim();
    const a = parseInt(ageDraft, 10);
    if (!n || !(a >= 5 && a <= 99)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(n, a);
    setEditing(false);
  };

  const share = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      try {
        if (navigator.share) await navigator.share({ text: SHARE_MESSAGE });
        else {
          await navigator.clipboard.writeText(SHARE_MESSAGE);
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        }
      } catch {
        // user dismissed the share sheet — fine
      }
    } else {
      Share.share({ message: SHARE_MESSAGE });
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Name & age */}
      <View style={[styles.card, { borderColor: c.dark }]}>
        {editing ? (
          <View style={{ gap: 10 }}>
            <Text style={[styles.label, { color: c.muted }]}>YOUR NAME & AGE</Text>
            <TextInput
              style={[styles.input, { borderColor: c.dark, color: c.dark }]}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="First name"
              placeholderTextColor={c.muted}
            />
            <TextInput
              style={[styles.input, { borderColor: c.dark, color: c.dark }]}
              value={ageDraft}
              onChangeText={(t) => setAgeDraft(t.replace(/\D/g, ''))}
              placeholder="Age"
              placeholderTextColor={c.muted}
              keyboardType="numeric"
              maxLength={3}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={saveProfile} style={[styles.smallBtn, { backgroundColor: c.green, borderColor: c.dark, flex: 1 }]}>
                <Text style={[styles.smallBtnText, { color: '#12291f' }]}>SAVE</Text>
              </Pressable>
              <Pressable onPress={() => setEditing(false)} style={[styles.smallBtn, { backgroundColor: c.card, borderColor: c.dark, flex: 1 }]}>
                <Text style={[styles.smallBtnText, { color: c.dark }]}>CANCEL</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: c.muted }]}>YOUR NAME & AGE</Text>
              <Text style={[styles.value, { color: c.dark }]}>
                {state.name}{state.age ? ` · ${state.age}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setNameDraft(state.name);
                setAgeDraft(state.age ? String(state.age) : '');
                setEditing(true);
              }}
              style={[styles.smallBtn, { backgroundColor: c.card, borderColor: c.dark }]}>
              <View style={styles.btnInner}>
                <Feather name="edit-2" size={12} color={c.dark} />
                <Text style={[styles.smallBtnText, { color: c.dark }]}>EDIT</Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {/* Sounds */}
      <View style={[styles.card, styles.row, { borderColor: c.dark }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.btnInner}>
            <Feather name={state.soundOn ? 'volume-2' : 'volume-x'} size={15} color={c.dark} />
            <Text style={[styles.value, { color: c.dark }]}>Study sounds</Text>
          </View>
          <Text style={[styles.sub, { color: c.muted }]}>Chimes when you get answers right</Text>
        </View>
        <Switch
          value={state.soundOn}
          onValueChange={setSoundOn}
          trackColor={{ false: c.borderLight, true: c.green }}
          thumbColor="#fff"
        />
      </View>

      {/* Replay tour */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setTourSeen(false);
        }}
        style={[styles.card, { borderColor: c.dark, alignItems: 'center' }]}>
        <View style={styles.btnInner}>
          <Feather name="rotate-ccw" size={14} color={c.dark} />
          <Text style={[styles.value, { color: c.dark }]}>REPLAY APP TOUR</Text>
        </View>
      </Pressable>

      {/* Share */}
      <View style={[styles.shareBox, { borderColor: c.primary, backgroundColor: c.purpleLight }]}>
        <Text style={[styles.shareTitle, { color: c.primary }]}>KNOW SOMEONE WHO SHOULD STUDY SMARTER?</Text>
        <Text style={[styles.sub, { color: c.subtle }]}>Send them Stickpoint — it's free to use.</Text>
        <Pressable onPress={share} style={[styles.shareBtn, { backgroundColor: c.primary, borderColor: c.dark }]}>
          <View style={styles.btnInner}>
            <Feather name={shared ? 'check' : 'send'} size={14} color="#fff" />
            <Text style={styles.shareBtnText}>{shared ? 'LINK COPIED!' : 'SEND STICKPOINT'}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2.5, padding: 14, backgroundColor: '#fff',
    boxShadow: '3px 3px 0px #201E2E',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  value: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  sub: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  input: { borderWidth: 3, padding: 11, fontSize: 15, fontWeight: '700', backgroundColor: '#fff' },
  smallBtn: { borderWidth: 2, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center' },
  smallBtnText: { fontWeight: '900', fontSize: 12 },
  shareBox: { borderWidth: 2.5, padding: 16, gap: 8, alignItems: 'center' },
  shareTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  shareBtn: {
    borderWidth: 3, paddingVertical: 12, paddingHorizontal: 20, marginTop: 4,
    boxShadow: '3px 3px 0px #201E2E',
  },
  shareBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
