// src/screens/HomeScreen.tsx
// ============================================================
// Main screen: lists all spaces with filter tabs
// Starts a search session timer when opened
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SpaceCard } from '../components/SpaceCard';
import { LoadingScreen } from '../components/UI';
import { useSearchSession, useSpaces } from '../hooks/useSpaces';
import { Colors, FontSize, Radius, Spacing } from '../lib/theme';
import { SpaceStatus } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'lab',        label: 'Labs' },
  { key: 'library',    label: 'Library' },
  { key: 'group_room', label: 'Group Rooms' },
];

interface Props {
  navigation: any;
}

export function HomeScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { spaces, loading, refresh } = useSpaces(activeFilter === 'all' ? undefined : activeFilter);
  const { startSession } = useSearchSession();
  const { user } = useAuth();

  // FIX: depend on user so startSession runs after auth is restored from
  // AsyncStorage — on first mount user is null and startSession would
  // return early, leaving sessions at 0.
  useEffect(() => {
    if (user) startSession();
  }, [user]);

  const filtered = spaces.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.building.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = spaces.filter(s => s.last_status === 'free').length;

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Find a Study Space</Text>
          <Text style={styles.sub}>{availableCount} of {spaces.length} spaces available</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
          <Ionicons name="person-circle-outline" size={32} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search spaces or buildings..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} onPress={() => setActiveFilter(f.key)}
            style={[styles.tab, activeFilter === f.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeFilter === f.key && styles.tabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Availability summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryDot} />
        <Text style={styles.summaryText}>Live · Updates in real-time</Text>
      </View>

      {/* Space list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SpaceCard
            space={item}
            onPress={() => navigation.navigate('SpaceDetail', { spaceId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No spaces found</Text>
            <Text style={styles.emptySub}>Try a different filter or search term</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.accent} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md },
  greeting:  { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub:       { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  avatarBtn: { padding: 4 },

  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, marginLeft: Spacing.sm },

  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.md },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  tabText:   { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  tabTextActive: { color: Colors.accentLight },

  summaryBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm },
  summaryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.free,
    marginRight: 6 },
  summaryText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  emptySub:  { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
});
