-- ============================================================
-- StudySpaceFinder - Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SPACES TABLE
-- Stores all campus study spaces
-- ============================================================
CREATE TABLE spaces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('lab', 'library', 'group_room')),
  building    TEXT NOT NULL,
  floor       INT DEFAULT 1,
  capacity    INT NOT NULL DEFAULT 20,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with research metadata
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  faculty     TEXT,
  year_level  INT CHECK (year_level BETWEEN 1 AND 4),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHECK_INS TABLE
-- Core table: crowdsourced occupancy reports
-- ============================================================
CREATE TABLE check_ins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id    UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('occupied', 'free')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HEADCOUNTS TABLE
-- Ground-truth observer data (for research accuracy comparison)
-- ============================================================
CREATE TABLE headcounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id    UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  observer_id UUID REFERENCES profiles(id),
  count       INT NOT NULL CHECK (count >= 0),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEARCH_SESSIONS TABLE
-- Tracks time-to-find metric for research (RQ1)
-- ============================================================
CREATE TABLE search_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,                        -- set when user checks in
  space_id        UUID REFERENCES spaces(id),         -- which space they ended up at
  search_duration_seconds INT                         -- computed on resolve
);

-- ============================================================
-- SURVEY_RESPONSES TABLE
-- TAM questionnaire for research data
-- ============================================================
CREATE TABLE survey_responses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  perceived_useful  INT CHECK (perceived_useful BETWEEN 1 AND 5),   -- TAM: PU
  perceived_ease    INT CHECK (perceived_ease BETWEEN 1 AND 5),     -- TAM: PEOU
  trust_in_data     INT CHECK (trust_in_data BETWEEN 1 AND 5),
  would_continue    INT CHECK (would_continue BETWEEN 1 AND 5),
  open_feedback     TEXT,
  submitted_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA - Sample campus spaces
-- ============================================================
INSERT INTO spaces (name, type, building, floor, capacity) VALUES
  ('Computer Lab A',        'lab',        'ICT Building',   1, 40),
  ('Computer Lab B',        'lab',        'ICT Building',   2, 35),
  ('Computer Lab C',        'lab',        'Engineering',    1, 30),
  ('Main Library Floor 1',  'library',    'Main Library',   1, 80),
  ('Main Library Floor 2',  'library',    'Main Library',   2, 60),
  ('Quiet Study Zone',      'library',    'Main Library',   3, 40),
  ('Group Room 1',          'group_room', 'Student Centre', 1, 8),
  ('Group Room 2',          'group_room', 'Student Centre', 1, 8),
  ('Group Room 3',          'group_room', 'Science Block',  2, 10),
  ('Postgrad Study Lounge', 'library',    'Admin Building', 3, 25);

-- ============================================================
-- VIEWS
-- ============================================================

-- Latest occupancy status per space (used by the app home screen)
CREATE OR REPLACE VIEW space_status AS
SELECT
  s.id,
  s.name,
  s.type,
  s.building,
  s.floor,
  s.capacity,
  ci.status AS last_status,
  ci.created_at AS last_updated,
  ci.user_id AS last_reported_by
FROM spaces s
LEFT JOIN LATERAL (
  SELECT status, created_at, user_id
  FROM check_ins
  WHERE space_id = s.id
  ORDER BY created_at DESC
  LIMIT 1
) ci ON TRUE
WHERE s.is_active = TRUE;

-- Research export view: crowdsourced vs headcount comparison
CREATE OR REPLACE VIEW research_accuracy AS
SELECT
  s.name AS space_name,
  s.building,
  h.created_at::DATE AS date,
  DATE_TRUNC('hour', h.created_at) AS hour,
  h.count AS observer_count,
  s.capacity,
  ROUND((h.count::NUMERIC / s.capacity) * 100, 1) AS occupancy_pct,
  (SELECT status FROM check_ins
   WHERE space_id = s.id
   AND created_at BETWEEN h.created_at - INTERVAL '15 minutes'
                      AND h.created_at + INTERVAL '15 minutes'
   ORDER BY created_at DESC LIMIT 1) AS crowdsourced_status
FROM headcounts h
JOIN spaces s ON s.id = h.space_id
ORDER BY h.created_at DESC;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Spaces: anyone can read
CREATE POLICY "spaces_read_all" ON spaces FOR SELECT USING (TRUE);

-- Profiles: users manage their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Check-ins: anyone can read, authenticated users can insert
CREATE POLICY "checkins_read_all"  ON check_ins FOR SELECT USING (TRUE);
CREATE POLICY "checkins_insert"    ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Headcounts: readable by all (observers insert via service role)
CREATE POLICY "headcounts_read"    ON headcounts FOR SELECT USING (TRUE);

-- Search sessions: own only
CREATE POLICY "sessions_own"  ON search_sessions FOR ALL USING (auth.uid() = user_id);

-- Survey: own only
CREATE POLICY "survey_own"    ON survey_responses FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- REALTIME - Enable live updates on check_ins
-- Run in Supabase Dashboard → Database → Replication
-- Or uncomment below if using Supabase CLI:
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE check_ins;


-- Enable API access for all tables
ALTER TABLE check_ins        REPLICA IDENTITY FULL;
ALTER TABLE headcounts       REPLICA IDENTITY FULL;
ALTER TABLE profiles         REPLICA IDENTITY FULL;
ALTER TABLE search_sessions  REPLICA IDENTITY FULL;
ALTER TABLE survey_responses REPLICA IDENTITY FULL;
ALTER TABLE spaces           REPLICA IDENTITY FULL;

-- Grant access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON check_ins        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON headcounts       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles         TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON search_sessions  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON survey_responses TO anon, authenticated;
GRANT SELECT                         ON spaces           TO anon, authenticated;
GRANT SELECT                         ON space_status     TO anon, authenticated;