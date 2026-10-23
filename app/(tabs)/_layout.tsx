import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/lib/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.bgCard, borderTopColor: Colors.border },
      tabBarActiveTintColor: Colors.accent,
      tabBarInactiveTintColor: Colors.textMuted,
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Spaces',
        tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />
      }} />
      <Tabs.Screen name="map" options={{
        title: 'Map',
        tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
      }} />
    </Tabs>
  );
}
