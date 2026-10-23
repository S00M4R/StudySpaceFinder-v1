// src/screens/ProfileScreen.tsx
// ============================================================
// User profile: shows their research stats, sign out, etc.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, LoadingScreen } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { Colors, FontSize, Radius, Spacing } from '../lib/theme';

interface Stats {
  totalCheckIns: number;
  avgSearchTime: number | null;
  totalSessions: number;
}

export function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // FIX: useFocusEffect re-runs every time this screen comes into focus
  // (e.g. switching back to the Profile tab after a check-in or session
  // resolve), so stats are always up to date without a full app reload.
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!user) return;

        const [profileRes, checkInsRes, sessionsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('check_ins').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('search_sessions')
            .select('search_duration_seconds')
            .eq('user_id', user.id)
            .not('resolved_at', 'is', null),
        ]);

        if (profileRes.data) setProfile(profileRes.data);

        const totalCheckIns = checkInsRes.count || 0;
        const sessions = sessionsRes.data || [];
        const resolved = sessions.filter(s => s.search_duration_seconds !== null);
        const avgSearchTime = resolved.length > 0
          ? Math.round(resolved.reduce((a, b) => a + b.search_duration_seconds, 0) / resolved.length)
          : null;

        setStats({ totalCheckIns, avgSearchTime, totalSessions: sessions.length });
        setLoading(false);
      };
      load();
    }, [user])
  );

  if (loading) return <LoadingScreen />;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.accent} />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badgeRow}>
          {profile?.faculty && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{profile.faculty}</Text>
            </View>
          )}
          {profile?.year_level && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Year {profile.year_level}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Research contribution stats */}
      <Text style={styles.sectionTitle}>Your Research Contribution</Text>
      <Text style={styles.sectionSub}>
        Data you generate helps measure the app's effectiveness for the study.
      </Text>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalCheckIns ?? 0}</Text>
          <Text style={styles.statLabel}>Check-ins submitted</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalSessions ?? 0}</Text>
          <Text style={styles.statLabel}>Search sessions</Text>
        </Card>
        <Card style={[styles.statCard, styles.statCardWide]}>
          <Text style={styles.statValue}>
            {stats?.avgSearchTime != null ? formatTime(stats.avgSearchTime) : '—'}
          </Text>
          <Text style={styles.statLabel}>Avg. time to find a space</Text>
        </Card>
      </View>

      {/* Survey CTA */}
      <Card style={styles.surveyCard}>
        <View style={styles.surveyRow}>
          <View style={styles.surveyIcon}>
            <Ionicons name="clipboard-outline" size={24} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.surveyTitle}>Complete the Research Survey</Text>
            <Text style={styles.surveySub}>Takes 2 minutes · Helps the research</Text>
          </View>
        </View>
        <Button label="Take Survey" onPress={() => navigation.navigate('Survey')} variant="ghost" />
      </Card>

      {/* Research info */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>About This Study</Text>
        <Text style={styles.infoText}>
          This app is part of a 3rd-year IT research project evaluating the impact of a
          real-time mobile application on campus study space utilisation.{'\n\n'}
          All data you submit is anonymised before analysis. You may withdraw from the
          study at any time — your data will be removed upon request.{'\n\n'}
          Research guided by the Technology Acceptance Model (Davis, 1989) and an
          open-source data reliability framework (Li et al., 2023).
        </Text>
      </Card>

      <Button label="Sign Out" onPress={signOut} variant="secondary" fullWidth style={{ marginTop: Spacing.md }} />

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  scroll:      { padding: Spacing.lg, paddingTop: 56 },

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar:      { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    borderWidth: 2, borderColor: Colors.accent },
  email:       { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  badgeRow:    { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
  badge:       { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  badgeText:   { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },

  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800', marginBottom: 4 },
  sectionSub:   { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 },

  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  statCard:    { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: Spacing.lg },
  statCardWide:{ minWidth: '100%' },
  statValue:   { color: Colors.accent, fontSize: FontSize.xxl, fontWeight: '900', letterSpacing: -0.5 },
  statLabel:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4, textAlign: 'center' },

  surveyCard:  { marginBottom: Spacing.md },
  surveyRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  surveyIcon:  { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center' },
  surveyTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSize.md },
  surveySub:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  infoCard:    { marginBottom: Spacing.md },
  infoTitle:   { color: Colors.textPrimary, fontWeight: '800', fontSize: FontSize.md, marginBottom: 8 },
  infoText:    { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20 },
});
