-- ===========================
-- LEARNING NUGGET SUPABASE SCHEMA - FIXED VERSION
-- ===========================

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    learning_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course progress table
CREATE TABLE IF NOT EXISTS course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    path_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id, path_id, module_id, lesson_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL, -- 'lesson_completed', 'module_completed', 'streak', etc.
    achievement_data JSONB DEFAULT '{}',
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user settings table (for future use)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT true,
    progress_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ===========================
-- RLS POLICIES (FIXED)
-- ===========================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own progress" ON course_progress;
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;

-- Profiles policies (allow insert for new users)
CREATE POLICY "Enable all operations for own profile" ON profiles
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow profile creation" ON profiles
    FOR INSERT WITH CHECK (true);

-- Course progress policies
CREATE POLICY "Enable all operations for own progress" ON course_progress
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Achievement policies
CREATE POLICY "Enable all operations for own achievements" ON achievements
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User settings policies (allow insert for new users)
CREATE POLICY "Enable all operations for own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow settings creation" ON user_settings
    FOR INSERT WITH CHECK (true);

-- ===========================
-- FUNCTIONS AND TRIGGERS (FIXED)
-- ===========================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Simplified function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile with error handling
    BEGIN
        INSERT INTO public.profiles (id, username, full_name, avatar_url)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
        );
    EXCEPTION WHEN OTHERS THEN
        -- If profile creation fails, log but don't stop user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Insert user settings with error handling
    BEGIN
        INSERT INTO public.user_settings (user_id)
        VALUES (NEW.id);
    EXCEPTION WHEN OTHERS THEN
        -- If settings creation fails, log but don't stop user creation
        RAISE WARNING 'Failed to create settings for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_settings updated_at
DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Indexes for course_progress
CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_completed_at ON course_progress(completed_at DESC);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON achievements(earned_at DESC);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ===========================
-- HELPFUL VIEWS
-- ===========================

-- View for user progress statistics
CREATE OR REPLACE VIEW user_progress_stats AS
SELECT 
    p.id as user_id,
    p.username,
    COUNT(cp.id) as total_lessons_completed,
    COUNT(DISTINCT CONCAT(cp.course_id, '.', cp.path_id, '.', cp.module_id)) as modules_completed,
    COUNT(DISTINCT cp.course_id) as courses_started,
    COUNT(CASE WHEN cp.completed_at >= CURRENT_DATE THEN 1 END) as lessons_today,
    COUNT(CASE WHEN cp.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as lessons_this_week
FROM profiles p
LEFT JOIN course_progress cp ON p.id = cp.user_id
GROUP BY p.id, p.username;

-- View for recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    cp.user_id,
    cp.course_id,
    cp.path_id,
    cp.module_id,
    cp.lesson_id,
    cp.completed_at,
    p.username
FROM course_progress cp
JOIN profiles p ON cp.user_id = p.id
ORDER BY cp.completed_at DESC;