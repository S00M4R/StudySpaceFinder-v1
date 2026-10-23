// src/lib/supabase.ts
// ============================================================
// Supabase client setup
// Credentials are read from environment variables (see .env.example).
// Expo inlines any variable prefixed with EXPO_PUBLIC_ at build time.
// Only ever use the *anon* key here -- never the service_role key.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart Expo.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================================
// Database types (mirrors your SQL schema)
// ============================================================

export type SpaceType = 'lab' | 'library' | 'group_room';
export type OccupancyStatus = 'occupied' | 'free';

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  building: string;
  floor: number;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface SpaceStatus extends Space {
  last_status: OccupancyStatus | null;
  last_updated: string | null;
  last_reported_by: string | null;
}

export interface CheckIn {
  id: string;
  space_id: string;
  user_id: string;
  status: OccupancyStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  faculty: string | null;
  year_level: number | null;
  created_at: string;
}

export interface SearchSession {
  id: string;
  user_id: string;
  started_at: string;
  resolved_at: string | null;
  space_id: string | null;
  search_duration_seconds: number | null;
}

export interface Headcount {
  id: string;
  space_id: string;
  observer_id: string | null;
  count: number;
  note: string | null;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  user_id: string;
  perceived_useful: number;
  perceived_ease: number;
  trust_in_data: number;
  would_continue: number;
  open_feedback: string;
  submitted_at: string;
}
