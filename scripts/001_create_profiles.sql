-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nombres TEXT,
  apellidos TEXT,
  cedula TEXT,
  telefono TEXT,
  fecha_nacimiento DATE,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT DEFAULT 'Colombia',
  foto_perfil TEXT,
  registration_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_preferences table for theme customization
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Colors
  primary_color TEXT DEFAULT '#10b981',
  secondary_color TEXT DEFAULT '#1e1b4b',
  background_color TEXT DEFAULT '#0c0a1d',
  card_color TEXT DEFAULT '#161333',
  text_color TEXT DEFAULT '#f5f5f5',
  accent_color TEXT DEFAULT '#22c55e',
  -- Font
  font_family TEXT DEFAULT 'Inter',
  font_size TEXT DEFAULT 'medium',
  -- Background image
  background_image TEXT,
  background_opacity DECIMAL DEFAULT 0.3,
  -- Sidebar
  sidebar_color TEXT DEFAULT '#0a0818',
  -- Other preferences
  language TEXT DEFAULT 'es',
  currency TEXT DEFAULT 'COP',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for user_preferences
CREATE POLICY "preferences_select_own" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "preferences_update_own" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "preferences_delete_own" ON public.user_preferences FOR DELETE USING (auth.uid() = user_id);
