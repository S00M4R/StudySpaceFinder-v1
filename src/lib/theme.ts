// src/lib/theme.ts
// ============================================================
// App-wide design system
// ============================================================

export const Colors = {
  // Primary palette — deep navy campus feel
  bg:           '#0A0F1E',
  bgCard:       '#111827',
  bgElevated:   '#1C2539',
  border:       '#1F2D45',

  // Accent
  accent:       '#3B82F6',    // electric blue
  accentLight:  '#60A5FA',
  accentGlow:   'rgba(59,130,246,0.15)',

  // Status colours
  free:         '#10B981',    // emerald green
  freeLight:    'rgba(16,185,129,0.15)',
  occupied:     '#EF4444',    // red
  occupiedLight:'rgba(239,68,68,0.15)',
  unknown:      '#6B7280',    // grey

  // Text
  textPrimary:  '#F9FAFB',
  textSecondary:'#9CA3AF',
  textMuted:    '#4B5563',

  // Space type colours
  lab:          '#8B5CF6',    // violet
  labLight:     'rgba(139,92,246,0.15)',
  library:      '#F59E0B',    // amber
  libraryLight: 'rgba(245,158,11,0.15)',
  group_room:   '#06B6D4',    // cyan
  groupLight:   'rgba(6,182,212,0.15)',
};

export const Spacing = {
  xs: 4,  sm: 8,  md: 16,  lg: 24,  xl: 32,  xxl: 48,
};

export const Radius = {
  sm: 8,  md: 12,  lg: 16,  xl: 24,  full: 999,
};

export const FontSize = {
  xs: 11,  sm: 13,  md: 15,  lg: 18,  xl: 22,  xxl: 28,  xxxl: 36,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Space type display helpers
export const SpaceTypeLabel: Record<string, string> = {
  lab:        'Computer Lab',
  library:    'Library',
  group_room: 'Group Room',
};

export const SpaceTypeColor: Record<string, string> = {
  lab:        Colors.lab,
  library:    Colors.library,
  group_room: Colors.group_room,
};

export const SpaceTypeBg: Record<string, string> = {
  lab:        Colors.labLight,
  library:    Colors.libraryLight,
  group_room: Colors.groupLight,
};

export const SpaceTypeIcon: Record<string, string> = {
  lab:        'desktop-outline',
  library:    'book-outline',
  group_room: 'people-outline',
};
