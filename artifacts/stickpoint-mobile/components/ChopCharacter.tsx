import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface Props {
  size?: number;
  color?: string;
  animation?: 'bounce' | 'tilt' | 'celebrate' | 'none';
}

export default function ChopCharacter({ size = 1, color = '#201E2E', animation = 'bounce' }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animation === 'none') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animation]);

  const translateY = animation === 'bounce'
    ? anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] })
    : undefined;

  const rotate = animation === 'tilt'
    ? anim.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] })
    : undefined;

  const s = size;
  const line = (top: number, left: number, width: number, height: number, rot?: string) => (
    <View style={{
      position: 'absolute',
      top: top * s,
      left: left * s,
      width: width * s,
      height: height * s,
      borderRadius: (Math.min(width, height) / 2) * s,
      backgroundColor: color,
      transform: rot ? [{ rotate: rot }] : undefined,
    }} />
  );

  const body = (
    <View style={{ width: 64 * s, height: 90 * s }}>
      {/* Head circle */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 18 * s,
        width: 28 * s,
        height: 28 * s,
        borderRadius: 14 * s,
        borderWidth: 4 * s,
        borderColor: color,
        backgroundColor: 'transparent',
      }} />
      {/* Body */}
      {line(28, 30, 4, 24)}
      {/* Left arm */}
      {line(26, 12, 20, 4)}
      {/* Right arm */}
      {line(26, 32, 20, 4)}
      {/* Left leg */}
      <View style={{
        position: 'absolute',
        top: 52 * s,
        left: 6 * s,
        width: 26 * s,
        height: 4 * s,
        borderRadius: 2 * s,
        backgroundColor: color,
        transform: [{ rotate: '-35deg' }],
      }} />
      {/* Right leg */}
      <View style={{
        position: 'absolute',
        top: 52 * s,
        left: 32 * s,
        width: 26 * s,
        height: 4 * s,
        borderRadius: 2 * s,
        backgroundColor: color,
        transform: [{ rotate: '35deg' }],
      }} />
    </View>
  );

  return (
    <Animated.View style={{ transform: [translateY ? { translateY } : rotate ? { rotate } : { translateY: 0 }] }}>
      {body}
    </Animated.View>
  );
}
