-- Migration: User Auth and Children Management
-- Adds user authentication fields, children table, and child-session association

-- 1. Add user authentication fields to mp_users
ALTER TABLE mp_users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE mp_users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE mp_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE mp_users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 2. Create children table
DROP TABLE IF EXISTS mp_children CASCADE;
CREATE TABLE mp_children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mp_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('boy', 'girl', null)),
  interests TEXT[] DEFAULT '{}',
  birth_date DATE,
  avatar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS for children table
ALTER TABLE mp_children ENABLE ROW LEVEL SECURITY;

-- 4. Drop and recreate RLS policies for children (idempotent)
DROP POLICY IF EXISTS "Users can CRUD their own children" ON mp_children;
CREATE POLICY "Users can CRUD their own children"
  ON mp_children
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Add child_id to sessions table
ALTER TABLE mp_sessions ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES mp_children(id);

-- 6. Create indexes
DROP INDEX IF EXISTS idx_mp_children_user_id;
DROP INDEX IF EXISTS idx_mp_children_is_active;
DROP INDEX IF EXISTS idx_mp_sessions_child_id;
CREATE INDEX idx_mp_children_user_id ON mp_children(user_id);
CREATE INDEX idx_mp_children_is_active ON mp_children(is_active);
CREATE INDEX idx_mp_sessions_child_id ON mp_sessions(child_id);

-- 7. Fix RLS policy for mp_users (idempotent)
DROP POLICY IF EXISTS "Users can CRUD their own data" ON mp_users;
CREATE POLICY "Users can CRUD their own data"
  ON mp_users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8. Create function to auto-create mp_users record on auth.users creation
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.mp_users (id, username, email, avatar)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to call the function on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
