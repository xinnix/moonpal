-- Moon Pal Database Schema
-- Reference: Run migrations via Supabase CLI: npx supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for parent accounts)
CREATE TABLE IF NOT EXISTS mp_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE mp_users ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own data
CREATE POLICY "Users can CRUD their own data"
  ON mp_users
  FOR ALL
  USING (auth.uid() = id);

-- Sessions table
CREATE TABLE IF NOT EXISTS mp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  energy_level NUMERIC NOT NULL DEFAULT 0.5,
  magic_note TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS for sessions
ALTER TABLE mp_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can CRUD their own sessions
CREATE POLICY "Users can CRUD their own sessions"
  ON mp_sessions
  FOR ALL
  USING (
    auth.uid()::TEXT = user_id
    OR user_id LIKE 'demo-%'
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_mp_sessions_user_id ON mp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mp_sessions_status ON mp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mp_sessions_created_at ON mp_sessions(created_at DESC);
