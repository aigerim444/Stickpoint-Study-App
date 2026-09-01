import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

/**
 * Countdown progress bar for AI generation waits — an honest estimate
 * beats an anonymous spinner. Counts down from `seconds` and parks at
 * "almost there…" if the call runs long.
 */
export default function EtaBar({ seconds }: { seconds: number }) {
  const colors = useColors();
  const [left, setLeft] = useState(seconds);
  const total = useRef(seconds);

  useEffect(() => {
    const iv = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { borderColor: colors.dark, backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, ((total.current - left) / total.current) * 100)}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.text, { color: colors.primary }]}>
        {left > 0 ? `about ${left} seconds left` : 'almost there…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  bar: { width: 260, height: 14, borderWidth: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  text: { fontSize: 12, fontWeight: '800' },
});
