import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import colors from '@/constants/colors';
import AppTour from '@/components/AppTour';

const c = colors.light;

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="today">
        <Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
        <Label>Today</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} />
        <Label>Study</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        <Label>Plan</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Progress</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <Icon sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }} />
        <Label>Library</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : c.dark,
          borderTopWidth: 3,
          borderTopColor: c.dark,
          elevation: 0,
          height: Platform.OS === 'web' ? 96 : 88,
        },
        tabBarLabelStyle: {
          fontWeight: '900',
          fontSize: 12,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.dark }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="sun.max" tintColor={color} size={26} />
            ) : (
              <Feather name="sun" size={26} color={color} />
            ),
          tabBarActiveTintColor: isIOS ? c.primary : '#FFC93C',
          tabBarInactiveTintColor: isIOS ? c.muted : '#8a8194',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Study',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bolt" tintColor={color} size={26} />
            ) : (
              <Feather name="zap" size={26} color={color} />
            ),
          tabBarActiveTintColor: isIOS ? c.primary : '#FFC93C',
          tabBarInactiveTintColor: isIOS ? c.muted : '#8a8194',
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={26} />
            ) : (
              <Feather name="calendar" size={26} color={color} />
            ),
          tabBarActiveTintColor: isIOS ? c.primary : '#FFC93C',
          tabBarInactiveTintColor: isIOS ? c.muted : '#8a8194',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.bar" tintColor={color} size={26} />
            ) : (
              <Feather name="bar-chart-2" size={26} color={color} />
            ),
          tabBarActiveTintColor: isIOS ? c.primary : '#FFC93C',
          tabBarInactiveTintColor: isIOS ? c.muted : '#8a8194',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="books.vertical" tintColor={color} size={26} />
            ) : (
              <Feather name="book" size={26} color={color} />
            ),
          tabBarActiveTintColor: isIOS ? c.primary : '#FFC93C',
          tabBarInactiveTintColor: isIOS ? c.muted : '#8a8194',
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const layout = isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
  return (
    <>
      {layout}
      <AppTour />
    </>
  );
}
