// src/components/SpaceCard.tsx
// ============================================================
// Card shown on the home screen for each study space
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSize, Radius, Spacing, SpaceTypeBg, SpaceTypeColor, SpaceTypeIcon, SpaceTypeLabel } from '../lib/theme';
import { SpaceStatus } from '../lib/supabase';
import { StatusBadge } from './UI';

interface SpaceCardProps {
  space: SpaceStatus;
  onPress: () => void;
}

export function SpaceCard({ space, onPress }: SpaceCardProps) {
  const typeColor  = SpaceTypeColor[space.type] || Colors.accent;
  const typeBg     = SpaceTypeBg[space.type]    || Colors.accentGlow;
  const typeLabel  = SpaceTypeLabel[space.type]  || space.type;
  const typeIcon   = SpaceTypeIcon[space.type]   || 'location-outline';

  const lastUpdated = space.last_updated
    ? formatDistanceToNow(new Date(space.last_updated), { addSuffix: true })
    : 'No data yet';

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.75}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: typeColor }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={[styles.iconBadge, { backgroundColor: typeBg }]}>
            <Ionicons name={typeIcon as any} size={16} color={typeColor} />
          </View>
          <Text style={[styles.typeLabel, { color: typeColor }]}>{typeLabel}</Text>
          <StatusBadge status={space.last_status} />
        </View>

        {/* Space name */}
        <Text style={styles.name}>{space.name}</Text>

        {/* Building + floor */}
        <View style={styles.metaRow}>
          <Ionicons name="business-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.meta}>{space.building} · Floor {space.floor}</Text>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View style={styles.capacityRow}>
            <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.capacity}>Capacity: {space.capacity}</Text>
          </View>
          <Text style={styles.updated}>{lastUpdated}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  accentBar: { width: 3 },
  body:      { flex: 1, padding: Spacing.md },
  chevron:   { alignSelf: 'center', paddingRight: Spacing.md },

  topRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBadge: { width: 26, height: 26, borderRadius: Radius.sm, alignItems: 'center',
    justifyContent: 'center', marginRight: 6 },
  typeLabel: { fontSize: FontSize.xs, fontWeight: '700', flex: 1, textTransform: 'uppercase',
    letterSpacing: 0.8 },

  name:      { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', marginBottom: 4 },

  metaRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  meta:      { color: Colors.textMuted, fontSize: FontSize.xs, marginLeft: 4 },

  bottomRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityRow:  { flexDirection: 'row', alignItems: 'center' },
  capacity:     { color: Colors.textMuted, fontSize: FontSize.xs, marginLeft: 4 },
  updated:      { color: Colors.textMuted, fontSize: FontSize.xs },
});
