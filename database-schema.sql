-- Regal Bingo Database Schema for Supabase

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  is_manager BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress table (Bingo board state)
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  square_1 BOOLEAN DEFAULT FALSE,
  square_2 BOOLEAN DEFAULT FALSE,
  square_3 BOOLEAN DEFAULT FALSE,
  square_4 BOOLEAN DEFAULT FALSE,
  square_5 BOOLEAN DEFAULT FALSE,
  square_6 BOOLEAN DEFAULT FALSE,
  square_7 BOOLEAN DEFAULT FALSE,
  square_8 BOOLEAN DEFAULT FALSE,
  square_9 BOOLEAN DEFAULT FALSE,
  square_10 BOOLEAN DEFAULT FALSE,
  square_11 BOOLEAN DEFAULT FALSE,
  square_12 BOOLEAN DEFAULT FALSE,
  square_13 BOOLEAN DEFAULT FALSE,
  square_14 BOOLEAN DEFAULT FALSE,
  square_15 BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Manager roles table to avoid recursive policy checks
CREATE TABLE IF NOT EXISTS manager_roles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress audit log
CREATE TABLE IF NOT EXISTS progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  square_field TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('check', 'uncheck')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS progress_logs_user_idx ON progress_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS progress_logs_square_idx ON progress_logs(square_field);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can only view their own progress
DROP POLICY IF EXISTS "Users can view own progress" ON progress;
CREATE POLICY "Users can view own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

-- Managers can view all users
DROP POLICY IF EXISTS "Managers can view all users" ON users;
CREATE POLICY "Managers can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM manager_roles
      WHERE manager_roles.user_id = auth.uid()
    )
  );

-- Managers can view all progress
DROP POLICY IF EXISTS "Managers can view all progress" ON progress;
CREATE POLICY "Managers can view all progress" ON progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM manager_roles
      WHERE manager_roles.user_id = auth.uid()
    )
  );

-- Managers can update any progress
DROP POLICY IF EXISTS "Managers can update progress" ON progress;
CREATE POLICY "Managers can update progress" ON progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM manager_roles
      WHERE manager_roles.user_id = auth.uid()
    )
  );

-- Users can view their own logs
DROP POLICY IF EXISTS "Users can view own logs" ON progress_logs;
CREATE POLICY "Users can view own logs" ON progress_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Managers can view all logs
DROP POLICY IF EXISTS "Managers can view all logs" ON progress_logs;
CREATE POLICY "Managers can view all logs" ON progress_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM manager_roles
      WHERE manager_roles.user_id = auth.uid()
    )
  );

-- Managers can insert log entries
DROP POLICY IF EXISTS "Managers can insert logs" ON progress_logs;
CREATE POLICY "Managers can insert logs" ON progress_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM manager_roles
      WHERE manager_roles.user_id = auth.uid()
    )
  );

-- Function to automatically create user record and progress on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user record
  INSERT INTO public.users (id, email, is_manager)
  VALUES (NEW.id, NEW.email, FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize blank Bingo board
  INSERT INTO public.progress (user_id, square_1, square_2, square_3, square_4, square_5, 
                               square_6, square_7, square_8, square_9, square_10, 
                               square_11, square_12, square_13, square_14, square_15)
  VALUES (NEW.id, FALSE, FALSE, FALSE, FALSE, FALSE, 
          FALSE, FALSE, FALSE, FALSE, FALSE, 
          FALSE, FALSE, FALSE, FALSE, FALSE)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync manager_roles table with users.is_manager
CREATE OR REPLACE FUNCTION public.sync_manager_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_manager THEN
    INSERT INTO public.manager_roles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.manager_roles WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS sync_manager_role_after_insert ON public.users;
CREATE TRIGGER sync_manager_role_after_insert
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_manager_role();

DROP TRIGGER IF EXISTS sync_manager_role_after_update ON public.users;
CREATE TRIGGER sync_manager_role_after_update
  AFTER UPDATE OF is_manager ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_manager_role();

