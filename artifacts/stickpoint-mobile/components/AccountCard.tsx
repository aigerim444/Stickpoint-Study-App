import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable, Share,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { supabase, accountsEnabled } from '@/lib/supabase';
import { deleteAccount, exportAccountData } from '@/lib/sync';

type Mode = 'idle' | 'email' | 'code' | 'busy';

/**
 * Sign in with an email one-time code (no passwords — we never handle
 * them), plus the account's data rights: export and permanent deletion.
 * Renders nothing when accounts aren't configured, so the app stays fully
 * usable local-only.
 */
export default function AccountCard() {
  const colors = useColors();
  const { account, resetApp } = useApp();
  const [mode, setMode] = useState<Mode>('idle');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const sendCode = useCallback(async () => {
    const addr = email.trim().toLowerCase();
    if (!supabase || !/^\S+@\S+\.\S+$/.test(addr)) {
      setError('Enter a real email address.');
      return;
    }
    setError('');
    setMode('busy');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true },
    });
    if (err) {
      setError('Could not send the code. Check the address and try again.');
      setMode('email');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode('code');
  }, [email]);

  const verifyCode = useCallback(async () => {
    if (!supabase || code.trim().length < 6) return;
    setError('');
    setMode('busy');
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    if (err) {
      setError("That code didn't work. Check it, or send a new one.");
      setMode('code');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode('idle');
    setCode('');
  }, [code, email]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setMode('idle');
  }, []);

  const onExport = useCallback(async () => {
    const json = await exportAccountData();
    if (!json) {
      Alert.alert('Export failed', 'Could not fetch your data. Are you online?');
      return;
    }
    if (Platform.OS === 'web') {
      // Browser: open the JSON in a new tab for the student to save.
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      await Share.share({ message: json, title: 'My Stickpoint data' });
    }
  }, []);

  const onDelete = useCallback(() => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and all synced study data. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteAccount();
            if (!ok) {
              Alert.alert('Something went wrong', 'Your account was not deleted. Try again.');
              return;
            }
            await supabase?.auth.signOut();
            resetApp();
            Alert.alert('Account deleted', 'Everything is gone. Thanks for trying Stickpoint.');
          },
        },
      ],
    );
  }, [resetApp]);

  if (!accountsEnabled) return null;

  const c = colors;

  if (account) {
    return (
      <View style={[styles.card, { borderColor: c.dark }]}>
        <View style={styles.row}>
          <Feather name="cloud" size={18} color={c.green} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.dark }]}>Synced</Text>
            <Text style={[styles.sub, { color: c.muted }]}>{account.email}</Text>
          </View>
        </View>
        <Text style={[styles.body, { color: c.subtle }]}>
          Your progress is backed up — sign in on any device to pick up where you left off.
        </Text>
        <View style={styles.btnRow}>
          <Pressable onPress={onExport} style={[styles.smallBtn, { borderColor: c.dark, backgroundColor: c.card }]}>
            <Text style={[styles.smallBtnText, { color: c.dark }]}>EXPORT MY DATA</Text>
          </Pressable>
          <Pressable onPress={signOut} style={[styles.smallBtn, { borderColor: c.dark, backgroundColor: c.card }]}>
            <Text style={[styles.smallBtnText, { color: c.dark }]}>SIGN OUT</Text>
          </Pressable>
        </View>
        <Pressable onPress={onDelete}>
          <Text style={[styles.deleteLink, { color: c.red }]}>Delete my account and all data</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'busy') {
    return (
      <View style={[styles.card, styles.center, { borderColor: c.dark }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (mode === 'code') {
    return (
      <View style={[styles.card, { borderColor: c.dark }]}>
        <Text style={[styles.title, { color: c.dark }]}>Check your email</Text>
        <Text style={[styles.body, { color: c.subtle }]}>
          We sent a 6-digit code to {email.trim()}. Type it here:
        </Text>
        <TextInput
          style={[styles.input, { borderColor: c.dark, color: c.dark, backgroundColor: c.card }]}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={c.muted}
          autoFocus
        />
        {!!error && <Text style={[styles.error, { color: c.red }]}>{error}</Text>}
        <Pressable
          onPress={verifyCode}
          disabled={code.trim().length < 6}
          style={[styles.btn, { backgroundColor: code.trim().length >= 6 ? c.primary : c.secondary, borderColor: c.dark }]}>
          <Text style={[styles.btnText, { color: code.trim().length >= 6 ? '#fff' : c.muted }]}>VERIFY</Text>
        </Pressable>
        <Pressable onPress={() => setMode('email')}>
          <Text style={[styles.link, { color: c.muted }]}>Different email / resend</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'email') {
    return (
      <View style={[styles.card, { borderColor: c.dark }]}>
        <Text style={[styles.title, { color: c.dark }]}>Back up your progress</Text>
        <Text style={[styles.body, { color: c.subtle }]}>
          We'll email you a one-time code — no password to remember, no password to leak.
        </Text>
        <TextInput
          style={[styles.input, { borderColor: c.dark, color: c.dark, backgroundColor: c.card }]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          placeholderTextColor={c.muted}
          autoFocus
        />
        {!!error && <Text style={[styles.error, { color: c.red }]}>{error}</Text>}
        <Pressable onPress={sendCode} style={[styles.btn, { backgroundColor: c.primary, borderColor: c.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>SEND ME A CODE</Text>
        </Pressable>
        <Pressable onPress={() => setMode('idle')}>
          <Text style={[styles.link, { color: c.muted }]}>Not now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: c.dark }]}>
      <View style={styles.row}>
        <Feather name="cloud-off" size={18} color={c.muted} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.dark }]}>Progress lives on this device</Text>
          <Text style={[styles.sub, { color: c.muted }]}>
            Sign in to back it up and use Stickpoint anywhere.
          </Text>
        </View>
      </View>
      <Pressable onPress={() => setMode('email')} style={[styles.btn, { backgroundColor: c.primary, borderColor: c.dark }]}>
        <Text style={[styles.btnText, { color: '#fff' }]}>SIGN IN WITH EMAIL</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3, padding: 16, gap: 10,
    boxShadow: '4px 4px 0px #201E2E',
  },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 14, fontWeight: '900' },
  sub: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  body: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  input: {
    borderWidth: 3, padding: 12, fontSize: 16, fontWeight: '700',
    letterSpacing: 1,
  },
  error: { fontSize: 12, fontWeight: '700' },
  btn: {
    borderWidth: 3, padding: 13, alignItems: 'center',
    boxShadow: '3px 3px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10 },
  smallBtn: { borderWidth: 2, paddingVertical: 9, paddingHorizontal: 12, flex: 1, alignItems: 'center' },
  smallBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  link: { fontSize: 12, fontWeight: '700', textAlign: 'center', paddingTop: 2 },
  deleteLink: { fontSize: 12, fontWeight: '800', textAlign: 'center', paddingTop: 4 },
});
