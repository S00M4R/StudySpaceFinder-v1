// src/screens/BuildingMapScreen.tsx
// ============================================================
// Interactive campus building map with live occupancy.
//
// IMPLEMENTATION: Uses React Native Views to render the floor
// plan — no extra native packages needed.
// Rooms are colour-coded green/red/grey by live status.
// Tapping any room navigates to its detail screen.
//
// TO INSTALL react-native-svg for a proper SVG map later:
//   npx expo install react-native-svg
// Then swap the floor plan section for an <Svg> version.
//
// CUSTOMISE ROOMS:
//   Edit ROOM_DEFS. x/y/w/h are percentages of the map canvas.
//   Set spaceName to match your Supabase space names exactly.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Rect, G, Circle, Text as SvgText } from 'react-native-svg';
import { useSpaces } from '../hooks/useSpaces';
import { Colors, FontSize, Radius, Spacing } from '../lib/theme';
import { SpaceStatus } from '../lib/supabase';

const SCREEN_W = Dimensions.get('window').width;
const MAP_W = SCREEN_W - Spacing.lg * 2;
const MAP_H = MAP_W * 0.75; // 4:3 aspect ratio

// ── Room definitions (positions as % of MAP_W / MAP_H) ───────
// spaceName must match space.name in Supabase exactly.
const ROOM_DEFS = [
  // ─ Ground floor ─
  { id: 'g1', label: 'Lab A',         spaceName: 'Computer Lab A',    floor: 0, xp: 0.02, yp: 0.04, wp: 0.29, hp: 0.20 },
  { id: 'g2', label: 'Lab B',         spaceName: 'Computer Lab B',    floor: 0, xp: 0.34, yp: 0.04, wp: 0.29, hp: 0.20 },
  { id: 'g3', label: 'Library',       spaceName: 'Main Library',      floor: 0, xp: 0.66, yp: 0.04, wp: 0.32, hp: 0.46 },
  { id: 'g4', label: 'Grp Rm 1',      spaceName: 'Group Room 1',      floor: 0, xp: 0.02, yp: 0.28, wp: 0.29, hp: 0.20 },
  { id: 'g5', label: 'Grp Rm 2',      spaceName: 'Group Room 2',      floor: 0, xp: 0.34, yp: 0.28, wp: 0.29, hp: 0.20 },
  { id: 'g6', label: 'Lab C',         spaceName: 'Computer Lab C',    floor: 0, xp: 0.02, yp: 0.52, wp: 0.29, hp: 0.20 },
  { id: 'g7', label: 'Lab D',         spaceName: 'Computer Lab D',    floor: 0, xp: 0.34, yp: 0.52, wp: 0.29, hp: 0.20 },
  { id: 'g8', label: 'Lib Study',     spaceName: 'Library Study Area',floor: 0, xp: 0.66, yp: 0.54, wp: 0.32, hp: 0.20 },
  // ─ First floor ─
  { id: 'f1', label: 'Lab E',         spaceName: 'Computer Lab E',    floor: 1, xp: 0.02, yp: 0.04, wp: 0.29, hp: 0.20 },
  { id: 'f2', label: 'Lab F',         spaceName: 'Computer Lab F',    floor: 1, xp: 0.34, yp: 0.04, wp: 0.29, hp: 0.20 },
  { id: 'f3', label: 'Lib Floor 1',   spaceName: 'Library Floor 1',   floor: 1, xp: 0.66, yp: 0.04, wp: 0.32, hp: 0.46 },
  { id: 'f4', label: 'Grp Rm 3',      spaceName: 'Group Room 3',      floor: 1, xp: 0.02, yp: 0.28, wp: 0.29, hp: 0.20 },
  { id: 'f5', label: 'Grp Rm 4',      spaceName: 'Group Room 4',      floor: 1, xp: 0.34, yp: 0.28, wp: 0.29, hp: 0.20 },
];

const FLOORS = [
  { key: 0, label: 'Ground Floor' },
  { key: 1, label: 'First Floor' },
];

function statusColor(status: string | null) {
  if (status === 'free')     return Colors.free;
  if (status === 'occupied') return Colors.occupied;
  return Colors.unknown;
}
function statusBg(status: string | null) {
  if (status === 'free')     return 'rgba(16,185,129,0.18)';
  if (status === 'occupied') return 'rgba(239,68,68,0.18)';
  return 'rgba(75,85,99,0.18)';
}

interface Props { navigation: any }

export function BuildingMapScreen({ navigation }: Props) {
  const { spaces } = useSpaces();
  const [activeFloor, setActiveFloor] = useState(0);

  // Index by name
  const byName: Record<string, SpaceStatus> = {};
  spaces.forEach(s => { byName[s.name] = s; });

  const floorRooms = ROOM_DEFS.filter(r => r.floor === activeFloor);
  const freeCount     = spaces.filter(s => s.last_status === 'free').length;
  const occupiedCount = spaces.filter(s => s.last_status === 'occupied').length;
  const unknownCount  = spaces.length - freeCount - occupiedCount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Campus Map</Text>
          <Text style={styles.sub}>Live occupancy · tap a room</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Legend */}
        <View style={styles.legend}>
          <LegendDot color={Colors.free}     label={`${freeCount} Free`} />
          <LegendDot color={Colors.occupied} label={`${occupiedCount} Full`} />
          <LegendDot color={Colors.unknown}  label={`${unknownCount} Unknown`} />
        </View>

        {/* Floor selector */}
        <View style={styles.floorTabs}>
          {FLOORS.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setActiveFloor(f.key)}
              style={[styles.floorTab, activeFloor === f.key && styles.floorTabActive]}>
              <Text style={[styles.floorTabText, activeFloor === f.key && styles.floorTabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floor plan */}
        <View style={[styles.mapCanvas, { width: MAP_W, height: MAP_H }]}>
          {/* Corridor */}
          <View style={styles.corridor}>
            <Text style={styles.corridorLabel}>MAIN CORRIDOR</Text>
          </View>

          {/* Lift / stairs box */}
          <View style={styles.liftBox}>
            <Ionicons name="arrow-up-outline" size={10} color={Colors.accentLight} />
            <Text style={styles.liftText}>LIFT{'\n'}STAIRS</Text>
          </View>

          {/* Rooms */}
          {floorRooms.map(room => {
            const space = byName[room.spaceName];
            const status = space?.last_status ?? null;
            return (
              <TouchableOpacity
                key={room.id}
                activeOpacity={0.75}
                onPress={() => space && navigation.navigate('SpaceDetail', { spaceId: space.id })}
                style={[styles.room, {
                  left:   room.xp * MAP_W,
                  top:    room.yp * MAP_H,
                  width:  room.wp * MAP_W,
                  height: room.hp * MAP_H,
                  backgroundColor: statusBg(status),
                  borderColor: statusColor(status),
                }]}>
                {/* Status indicator dot */}
                <View style={[styles.roomDot, { backgroundColor: statusColor(status) }]} />
                <Text style={styles.roomLabel} numberOfLines={1}>{room.label}</Text>
                {space && (
                  <Text style={styles.roomCap} numberOfLines={1}>{space.capacity}🪑</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Space list for this floor */}
        <Text style={styles.listTitle}>
          Spaces on {FLOORS.find(f => f.key === activeFloor)?.label}
        </Text>

        {floorRooms.map(room => {
          const space = byName[room.spaceName];
          return (
            <TouchableOpacity
              key={room.id}
              style={styles.rowItem}
              onPress={() => space && navigation.navigate('SpaceDetail', { spaceId: space.id })}
              disabled={!space}>
              <View style={[styles.rowDot, { backgroundColor: statusColor(space?.last_status ?? null) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{space?.name ?? room.spaceName}</Text>
                {space && (
                  <Text style={styles.rowMeta}>{space.capacity} seats · Floor {space.floor}</Text>
                )}
              </View>
              <Text style={[styles.rowStatus, { color: statusColor(space?.last_status ?? null) }]}>
                {space?.last_status === 'free' ? 'Free'
                  : space?.last_status === 'occupied' ? 'Full' : 'Unknown'}
              </Text>
              {space && <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          );
        })}

        

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md },
  title:     { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub:       { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  livePill:  { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 10, paddingVertical: 5 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.free },
  liveText:  { color: Colors.free, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },

  legend:    { flexDirection: 'row', gap: 16, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },

  floorTabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.md },
  floorTab:  { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  floorTabActive:     { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  floorTabText:       { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  floorTabTextActive: { color: Colors.accentLight },

  mapCanvas: { marginHorizontal: Spacing.lg, backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    position: 'relative', overflow: 'hidden', marginBottom: Spacing.lg },

  corridor: { position: 'absolute', left: 0, right: 0, top: '46%',
    height: 24, backgroundColor: 'rgba(28,37,57,0.9)',
    alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  corridorLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1 },

  liftBox: { position: 'absolute', left: '43%', top: '49%', width: '14%', height: '10%',
    backgroundColor: Colors.accentGlow, borderRadius: 4, borderWidth: 1, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  liftText: { color: Colors.accentLight, fontSize: 6, fontWeight: '700',
    textAlign: 'center', letterSpacing: 0.5 },

  room: { position: 'absolute', borderRadius: Radius.sm, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', padding: 2 },
  roomDot:   { position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 4 },
  roomLabel: { color: Colors.textPrimary, fontSize: 8, fontWeight: '700', textAlign: 'center' },
  roomCap:   { color: Colors.textMuted, fontSize: 7, textAlign: 'center' },

  listTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  rowItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowDot:    { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowName:   { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  rowMeta:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  rowStatus: { fontSize: FontSize.sm, fontWeight: '700' },

  hintBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, margin: Spacing.lg,
    backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: Spacing.md },
  hintText: { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 16, flex: 1 },
  hintCode: { fontFamily: 'monospace', color: Colors.accentLight },
});
