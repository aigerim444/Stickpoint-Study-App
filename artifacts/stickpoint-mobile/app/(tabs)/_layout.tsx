import React from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: c.dark,
        tabBarActiveBackgroundColor: c.dark,
        tabBarLabelPosition: 'beside-icon',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#FFFCF6',
          borderTopWidth: 3,
          borderTopColor: c.dark,
          elevation: 0,
          height: Platform.OS === 'web' ? 64 : 84,
        },
        tabBarLabelStyle: {
          fontWeight: '900',
          fontSize: 10,
          letterSpacing: 0,
        },
        tabBarItemStyle: {
          marginHorizontal: 2,
          marginVertical: 6,
          paddingHorizontal: 0,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'TODAY',
          tabBarIcon: ({ color }) => <Feather name="sun" size={14} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'STUDY',
          tabBarIcon: ({ color }) => <Feather name="zap" size={14} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'PLAN',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={14} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'PROGRESS',
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={14} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'LIBRARY',
          tabBarIcon: ({ color }) => <Feather name="book" size={14} color={color} />,
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
