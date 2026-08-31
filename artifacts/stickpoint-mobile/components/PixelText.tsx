import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

/**
 * The prototype's pixel headline face (Press Start 2P) — used for the logo,
 * screen titles, and celebration moments, exactly like the original app.
 */
export default function PixelText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.pixel, style]} />;
}

const styles = StyleSheet.create({
  pixel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#201E2E',
    lineHeight: undefined,
  },
});
