// src/screens/AuthScreen.tsx
// ============================================================
// Login and registration screen
// ============================================================

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '../lib/theme';
import { Button, ErrorMessage, Input } from '../components/UI';

const FACULTIES = ['Engineering', 'Science', 'Commerce', 'Humanities', 'Health Sciences', 'Law', 'Education', 'Other'];
const YEAR_LEVELS = [1, 2, 3, 4];

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [faculty, setFaculty] = useState('');
  const [yearLevel, setYearLevel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) { setError('Please enter email and password.'); return; }
    if (mode === 'register' && (!faculty || !yearLevel)) {
      setError('Please select your faculty and year level.'); return;
    }
    setLoading(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(email, password, faculty, yearLevel);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>📍</Text>
          <Text style={styles.appName}>StudySpace</Text>
          <Text style={styles.tagline}>Find your spot on campus</Text>
        </View>

        {/* Toggle */}
        <View style={styles.toggle}>
          {(['login', 'register'] as const).map(m => (
            <TouchableOpacity key={m} onPress={() => { setMode(m); setError(null); }}
              style={[styles.toggleBtn, mode === m && styles.toggleActive]}>
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <ErrorMessage message={error} />}

        {/* Form */}
        <Input label="University Email" value={email} onChangeText={setEmail}
          placeholder="student@university.ac.za" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Password" value={password} onChangeText={setPassword}
          placeholder="••••••••" secureTextEntry />

        {mode === 'register' && (
          <>
            {/* Faculty picker */}
            <Text style={styles.pickerLabel}>Faculty</Text>
            <View style={styles.grid}>
              {FACULTIES.map(f => (
                <TouchableOpacity key={f} onPress={() => setFaculty(f)}
                  style={[styles.chip, faculty === f && styles.chipActive]}>
                  <Text style={[styles.chipText, faculty === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Year level picker */}
            <Text style={styles.pickerLabel}>Year Level</Text>
            <View style={styles.yearRow}>
              {YEAR_LEVELS.map(y => (
                <TouchableOpacity key={y} onPress={() => setYearLevel(y)}
                  style={[styles.yearBtn, yearLevel === y && styles.yearBtnActive]}>
                  <Text style={[styles.yearText, yearLevel === y && styles.yearTextActive]}>
                    Year {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button label={mode === 'login' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit} loading={loading} fullWidth style={{ marginTop: Spacing.md }} />

        <Text style={styles.footnote}>
          Your data is anonymised and used only for research purposes.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.bg },
  container:  { padding: Spacing.lg, paddingTop: 80 },
  header:     { alignItems: 'center', marginBottom: Spacing.xl },
  logo:       { fontSize: 48, marginBottom: Spacing.sm },
  appName:    { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  tagline:    { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },

  toggle:     { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: Radius.lg,
    padding: 4, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  toggleBtn:  { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  toggleActive: { backgroundColor: Colors.accent },
  toggleText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.md },
  toggleTextActive: { color: '#fff' },

  pickerLabel:{ color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600',
    marginBottom: Spacing.sm },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  chipText:   { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  chipTextActive: { color: Colors.accentLight },

  yearRow:    { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  yearBtn:    { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center',
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  yearBtnActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  yearText:   { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  yearTextActive: { color: Colors.accentLight },

  footnote:   { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center',
    marginTop: Spacing.lg, lineHeight: 18 },
});
