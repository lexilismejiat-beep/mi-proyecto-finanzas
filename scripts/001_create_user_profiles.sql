-- Create user profiles table with personal data and theme preferences
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Personal data
  nombres TEXT,
  apellidos TEXT,
  cedula TEXT UNIQUE,
  telefono TEXT,
  fecha_nacimiento DATE,
  direccion TEXT,
  -- Registration status
  registro_completado BOOLEAN DEFAULT FALSE,
  -- Theme preferences
  color_primario TEXT DEFAULT '#22c55e',
  color_secundario TEXT DEFAULT '#1e1e2e',
  color_fondo TEXT DEFAULT '#0f0f17',
  color_texto TEXT DEFAULT '#f5f5f5',
  color_tarjetas TEXT DEFAULT '#1a1a2e',
  fuente_principal TEXT DEFAULT 'Inter',
  fuente_secundaria TEXT DEFAULT 'Inter',
  imagen_fondo_url TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_select_own_profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_own_profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
