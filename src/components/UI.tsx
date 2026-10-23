// src/components/UI.tsx
// ============================================================
// Shared UI components used across all screens
// ============================================================

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../lib/theme';

// ── Button ───────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style, fullWidth }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.btn,
        variant === 'primary'   && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'danger'    && styles.btnDanger,
        variant === 'ghost'     && styles.btnGhost,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'ghost' ? Colors.accent : '#fff'} size="small" />
        : <Text style={[styles.btnText, variant === 'ghost' && { color: Colors.accent }]}>
            {label}
          </Text>
      }
    </TouchableOpacity>
  );
}

// ── Input ────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'sentences', multiline, numberOfLines, style }: InputProps) {
  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, multiline && { height: numberOfLines ? numberOfLines * 24 : 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── StatusBadge ──────────────────────────────────────────────
export function StatusBadge({ status }: { status: 'free' | 'occupied' | null }) {
  const label = status === 'free' ? 'Available' : status === 'occupied' ? 'Occupied' : 'Unknown';
  const color = status === 'free' ? Colors.free : status === 'occupied' ? Colors.occupied : Colors.unknown;
  const bg    = status === 'free' ? Colors.freeLight : status === 'occupied' ? Colors.occupiedLight : 'rgba(107,114,128,0.15)';

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── ErrorMessage ─────────────────────────────────────────────
export function ErrorMessage({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

// ── LoadingScreen ────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={Colors.accent} size="large" />
    </View>
  );
}

// ── SectionHeader ────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

// ── StarRating ───────────────────────────────────────────────
export function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} style={styles.starBtn}>
            <Text style={[styles.star, n <= value && styles.starActive]}>{n <= value ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Button
  btn: { borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: Spacing.lg,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnPrimary:   { backgroundColor: Colors.accent },
  btnSecondary: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  btnDanger:    { backgroundColor: Colors.occupied },
  btnGhost:     { backgroundColor: 'transparent' },
  btnText:      { color: '#fff', fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.3 },

  // Input
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel:   { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary,
    fontSize: FontSize.md,
  },

  // Card
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border },

  // Status badge
  badge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full },
  dot:       { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: FontSize.sm, fontWeight: '700' },

  // Error
  errorBox:  { backgroundColor: Colors.occupiedLight, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.occupied },
  errorText: { color: Colors.occupied, fontSize: FontSize.sm },

  // Loading
  loadingScreen: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },

  // Section header
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitle:  { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  sectionSub:    { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },

  // Rating
  ratingRow:   { marginBottom: Spacing.md },
  ratingLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs, fontWeight: '600' },
  stars:       { flexDirection: 'row' },
  starBtn:     { paddingRight: Spacing.sm },
  star:        { fontSize: 26, color: Colors.textMuted },
  starActive:  { color: '#F59E0B' },
});
