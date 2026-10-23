// src/navigation/AppNavigator.tsx
// ============================================================
// Bottom tab navigator + stack for space detail
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SpaceDetailScreen } from '../screens/SpaceDetailScreen';
import { SurveyScreen } from '../screens/SurveyScreen';
import { Colors, FontSize } from '../lib/theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home stack: Home → SpaceDetail
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"        component={HomeScreen} />
      <Stack.Screen name="SpaceDetail" component={SpaceDetailScreen} />
    </Stack.Navigator>
  );
}

// Profile stack: Profile → Survey
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Survey"  component={SurveyScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.bgCard,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
          },
          tabBarActiveTintColor:   Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '700', marginTop: 2 },
          tabBarIcon: ({ color, size, focused }) => {
            const icons: Record<string, { active: string; inactive: string }> = {
              Spaces:  { active: 'search',          inactive: 'search-outline'          },
              Profile: { active: 'person',           inactive: 'person-outline'          },
            };
            const set = icons[route.name];
            const name = focused ? set?.active : set?.inactive;
            return <Ionicons name={(name || 'ellipse-outline') as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Spaces"  component={HomeStack}    />
        <Tab.Screen name="Profile" component={ProfileStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
