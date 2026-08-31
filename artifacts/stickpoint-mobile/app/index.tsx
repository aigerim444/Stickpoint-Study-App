import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

export default function Index() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.loaded) return;
    if (!state.name) {
      router.replace('/welcome');
    } else {
      // Land on the tabs even with no material: the Today tab invites you
      // to add notes without trapping you on the input screen.
      router.replace('/(tabs)');
    }
  }, [state.loaded, state.name]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.light.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background, alignItems: 'center', justifyContent: 'center' },
});
