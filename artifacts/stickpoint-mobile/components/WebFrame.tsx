import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * The prototype's phone-shaped stage: on wide web windows the app renders
 * inside a 600px ink-bordered cream card floating on a warm gradient,
 * exactly like the original Claude Design build. Native apps and narrow
 * windows are already phone-shaped, so this is a pass-through there.
 */
export default function WebFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > 680;

  if (!framed) return <>{children}</>;

  return (
    <LinearGradient
      colors={['#FFF3DE', '#FBE8D3', '#F6DCC0']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.backdrop}>
      <View style={styles.card}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 1440,
    flex: 1,
    backgroundColor: '#FFF9EF',
    borderWidth: 4,
    borderColor: '#201E2E',
    boxShadow: '8px 8px 0px #201E2E',
    overflow: 'hidden',
  },
});
