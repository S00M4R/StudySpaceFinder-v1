// src/screens/SpaceDetailScreen.tsx
// Shows full space info + check-in / check-out buttons
// Updated: uses spam-prevention cooldown from useCheckIn

import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { StatusBadge, Button, ErrorMessage, Card } from '../components/UI';
import { useCheckIn, useHeadcount, useSearchSession, useSpace } from '../hooks/useSpaces';
import {
  Colors, FontSize, Radius, Spacing,
  SpaceTypeColor, SpaceTypeIcon, SpaceTypeLabel,
} from '../lib/theme';

interface Props {
  navigation: any;
  route: { params: { spaceId: string } };
}

export function SpaceDetailScreen({ navigation, route }: Props) {
  const { spaceId } = route.params;
  const { space, recentCheckIns, loading } = useSpace(spaceId);
  const { checkIn, submitting, error, getCooldownSeconds } = useCheckIn();
  const { resolveSession } = useSearchSession();
  const { submitHeadcount, submitting: submittingHC } = useHeadcount();
  const [headcountInput, setHeadcountInput] = useState('');
  const [showObserver, setShowObserver] = useState(false);
  // Live countdown display
  const [cooldownSecs, setCooldownSecs] = useState(0);

  // Tick the cooldown display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownSecs(getCooldownSeconds(spaceId));
    }, 1000);
    return () => clearInterval(interval);
  }, [spaceId]);

  if (loading || !space) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading space...</Text>
      </View>
    );
  }

  const typeColor = SpaceTypeColor[space.type] || Colors.accent;
  const typeIcon  = SpaceTypeIcon[space.type]  || 'location-outline';
  const typeLabel = SpaceTypeLabel[space.type]  || space.type;

  const handleCheckIn = async (status: 'occupied' | 'free') => {
    const result = await checkIn(spaceId, status);
    if (result.success) {
      await resolveSession(spaceId);
      setCooldownSecs(getCooldownSeconds(spaceId));
      Alert.alert(
        status === 'occupied' ? '✅ Checked In!' : '👋 Checked Out!',
        status === 'occupied'
          ? `You've marked "${space.name}" as occupied. Thanks for helping other students!`
          : `You've marked "${space.name}" as free. Thanks!`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleHeadcount = async () => {
    const count = parseInt(headcountInput, 10);
    if (isNaN(count) || count < 0) {
      Alert.alert('Invalid count', 'Please enter a valid number.');
      return;
    }
    const success = await submitHeadcount(spaceId, count);
    if (success) {
      Alert.alert('✅ Headcount submitted', `Recorded ${count} people in ${space.name}.`);
      setHeadcountInput('');
      setShowObserver(false);
    }
  };

  const cooldownMins = Math.ceil(cooldownSecs / 60);
  const isOnCooldown = cooldownSecs > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: typeColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.typeChip, { backgroundColor: `${typeColor}20`, borderColor: typeColor }]}>
          <Ionicons name={typeIcon as any} size={14} color={typeColor} />
          <Text style={[styles.typeLabel, { color: typeColor }]}>{typeLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.name}>{space.name}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.meta}>{space.building} · Floor {space.floor}</Text>
        </View>

        {/* Status card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusTitle}>Current Status</Text>
              {space.last_updated && (
                <Text style={styles.statusTime}>
                  Updated {formatDistanceToNow(new Date(space.last_updated), { addSuffix: true })}
                </Text>
              )}
            </View>
            <StatusBadge status={space.last_status} />
          </View>
          <View style={styles.divider} />
          <View style={styles.capacityRow}>
            <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.capacityText}>Capacity: {space.capacity} seats</Text>
          </View>
        </Card>

        {/* Check-in section */}
        <Text style={styles.sectionTitle}>Report Current Status</Text>
        <Text style={styles.sectionSub}>
          Help other students by reporting whether this space is occupied or free right now.
        </Text>

        {error && <ErrorMessage message={error} />}

        {/* Cooldown banner */}
        {isOnCooldown && (
          <View style={styles.cooldownBanner}>
            <Ionicons name="time-outline" size={14} color={Colors.library} />
            <Text style={styles.cooldownText}>
              You can report again in {cooldownMins} min{cooldownMins !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <Button
            label={isOnCooldown ? `🟢 Free (${cooldownMins}m)` : "🟢  It's Free!"}
            onPress={() => handleCheckIn('free')}
            variant="secondary"
            loading={submitting}
            disabled={isOnCooldown}
            style={[styles.actionBtn, styles.freeBtn, isOnCooldown && styles.btnDisabled]}
          />
          <Button
            label={isOnCooldown ? `🔴 Full (${cooldownMins}m)` : "🔴  It's Full"}
            onPress={() => handleCheckIn('occupied')}
            variant="secondary"
            loading={submitting}
            disabled={isOnCooldown}
            style={[styles.actionBtn, styles.occupiedBtn, isOnCooldown && styles.btnDisabled]}
          />
        </View>

        {/* Recent activity */}
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {recentCheckIns.length === 0 ? (
          <Card>
            <Text style={styles.noActivity}>No reports yet. Be the first to check in!</Text>
          </Card>
        ) : (
          recentCheckIns.map(ci => (
            <View key={ci.id} style={styles.activityItem}>
              <View style={[styles.activityDot,
                { backgroundColor: ci.status === 'free' ? Colors.free : Colors.occupied }]} />
              <View>
                <Text style={styles.activityStatus}>
                  Marked as {ci.status === 'free' ? 'Available' : 'Occupied'}
                </Text>
                <Text style={styles.activityTime}>
                  {formatDistanceToNow(new Date(ci.created_at), { addSuffix: true })}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Observer / researcher headcount */}
        <TouchableOpacity onPress={() => setShowObserver(v => !v)} style={styles.observerToggle}>
          <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.observerToggleText}>Observer mode</Text>
          <Ionicons name={showObserver ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        {showObserver && (
          <Card style={styles.observerCard}>
            <Text style={styles.observerTitle}>Record Physical Headcount</Text>
            <Text style={styles.observerSub}>
              For research only. Enter the actual number of people you count in this space.
            </Text>
            <View style={styles.hcRow}>
              <View style={[styles.hcInput]}>
                <Ionicons name="people" size={16} color={Colors.textMuted} />
                <Text style={styles.hcValue}>{headcountInput || '0'}</Text>
              </View>
              <View style={styles.hcButtons}>
                <TouchableOpacity
                  onPress={() => setHeadcountInput(v => String(Math.max(0, parseInt(v || '0', 10) - 1)))}
                  style={styles.hcBtn}>
                  <Text style={styles.hcBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setHeadcountInput(v => String(parseInt(v || '0', 10) + 1))}
                  style={styles.hcBtn}>
                  <Text style={styles.hcBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Button label="Submit Headcount" onPress={handleHeadcount}
              loading={submittingHC} variant="ghost" />
          </Card>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  loading:     { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md, borderBottomWidth: 2 },
  back:        { padding: 4 },
  typeChip:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, gap: 6 },
  typeLabel:   { fontSize: FontSize.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  scroll:      { padding: Spacing.lg },
  name:        { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -0.5, marginBottom: 6 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  meta:        { color: Colors.textMuted, fontSize: FontSize.sm, marginLeft: 6 },

  statusCard:  { marginBottom: Spacing.lg },
  statusRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  statusTime:  { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 3 },
  divider:     { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capacityText:{ color: Colors.textSecondary, fontSize: FontSize.sm },

  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800',
    marginBottom: 4, marginTop: Spacing.md },
  sectionSub:   { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 },

  cooldownBanner: { flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: Radius.md, borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)', padding: Spacing.sm, marginBottom: Spacing.sm },
  cooldownText:   { color: Colors.library, fontSize: FontSize.sm, fontWeight: '600' },

  actionRow:   { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  actionBtn:   { flex: 1 },
  freeBtn:     { borderColor: Colors.free },
  occupiedBtn: { borderColor: Colors.occupied },
  btnDisabled: { opacity: 0.45 },

  activityItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  activityDot:    { width: 10, height: 10, borderRadius: 5 },
  activityStatus: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  activityTime:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  noActivity: { color: Colors.textMuted, textAlign: 'center', padding: Spacing.md },

  observerToggle:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg,
    alignSelf: 'center', padding: Spacing.sm },
  observerToggleText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },

  observerCard:  { marginTop: Spacing.sm },
  observerTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md, marginBottom: 4 },
  observerSub:   { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.md, lineHeight: 18 },
  hcRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  hcInput:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  hcValue:  { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  hcButtons:{ flexDirection: 'row', gap: 8 },
  hcBtn:    { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bgElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  hcBtnText:{ color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
});
