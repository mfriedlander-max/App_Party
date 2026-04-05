-- profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  weight_kg NUMERIC(5,1) NOT NULL DEFAULT 70.0,
  height_cm NUMERIC(5,1) NOT NULL DEFAULT 170.0,
  biological_sex TEXT NOT NULL DEFAULT 'male' CHECK (biological_sex IN ('male', 'female')),
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  streak_weekends INTEGER NOT NULL DEFAULT 0,
  last_active_weekend TEXT DEFAULT '',
  home_lat DOUBLE PRECISION,
  home_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- drink_catalog
CREATE TABLE public.drink_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL CHECK (category IN ('beer', 'cocktail', 'shot', 'wine', 'spirit', 'other')),
  emoji TEXT DEFAULT '',
  abv NUMERIC(5,3) NOT NULL,
  standard_volume_ml NUMERIC(6,1) NOT NULL,
  standard_drinks NUMERIC(4,2) NOT NULL,
  source TEXT DEFAULT 'manual',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- consumption_log
CREATE TABLE public.consumption_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  party_id UUID,  -- FK added after parties table
  catalog_item_id UUID REFERENCES public.drink_catalog(id),
  drink_type TEXT NOT NULL,
  estimated_alcohol_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  abv NUMERIC(5,3),
  volume_ml NUMERIC(6,1),
  vessel_type TEXT,
  fill_level NUMERIC(3,2) DEFAULT 1.0,
  image_url TEXT,
  is_manual_entry BOOLEAN NOT NULL DEFAULT false,
  ai_raw_response JSONB,
  user_corrections JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- parties
CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES public.profiles(id),
  invite_code TEXT NOT NULL UNIQUE,
  location_name TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for consumption_log.party_id
ALTER TABLE public.consumption_log ADD CONSTRAINT fk_consumption_party
  FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE SET NULL;

-- party_members (junction table)
CREATE TABLE public.party_members (
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('host', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  done BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (party_id, user_id)
);

-- friendships
CREATE TABLE public.friendships (
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, addressee_id)
);

-- location_log
CREATE TABLE public.location_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  venue_name TEXT,
  venue_place_id TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT DEFAULT '',
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_achievements (junction)
CREATE TABLE public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- media
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('drink_scan', 'in_app_capture', 'camera_roll_sync')),
  storage_url TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- corrections_log
CREATE TABLE public.corrections_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumption_log_id UUID NOT NULL REFERENCES public.consumption_log(id) ON DELETE CASCADE,
  original_ai_output JSONB NOT NULL,
  user_correction JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- recaps
CREATE TABLE public.recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slides JSONB NOT NULL DEFAULT '[]',
  media_ids UUID[] DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles: users can read own + friends' profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read friends profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND ((requester_id = auth.uid() AND addressee_id = profiles.id)
      OR (addressee_id = auth.uid() AND requester_id = profiles.id))
  )
);

-- drink_catalog: readable by all authenticated
CREATE POLICY "Authenticated users can read catalog" ON public.drink_catalog FOR SELECT USING (auth.role() = 'authenticated');

-- consumption_log: users can CRUD own
CREATE POLICY "Users can read own consumption" ON public.consumption_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consumption" ON public.consumption_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own consumption" ON public.consumption_log FOR DELETE USING (auth.uid() = user_id);

-- parties: members can read
CREATE POLICY "Party members can read party" ON public.parties FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.party_members WHERE party_id = parties.id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create parties" ON public.parties FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update party" ON public.parties FOR UPDATE USING (auth.uid() = host_id);

-- party_members
CREATE POLICY "Members can read party members" ON public.party_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.party_members pm WHERE pm.party_id = party_members.party_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Users can join parties" ON public.party_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.party_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave parties" ON public.party_members FOR DELETE USING (auth.uid() = user_id);

-- friendships
CREATE POLICY "Users can read own friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update received requests" ON public.friendships FOR UPDATE USING (auth.uid() = addressee_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- location_log
CREATE POLICY "Users can read own locations" ON public.location_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own locations" ON public.location_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- achievements: readable by all authenticated
CREATE POLICY "Authenticated can read achievements" ON public.achievements FOR SELECT USING (auth.role() = 'authenticated');

-- user_achievements
CREATE POLICY "Users can read own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- media
CREATE POLICY "Users can read own media" ON public.media FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own media" ON public.media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Party members can read party media" ON public.media FOR SELECT USING (
  party_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.party_members WHERE party_id = media.party_id AND user_id = auth.uid()
  )
);

-- corrections_log
CREATE POLICY "Users can read own corrections" ON public.corrections_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.consumption_log WHERE id = corrections_log.consumption_log_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own corrections" ON public.corrections_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.consumption_log WHERE id = corrections_log.consumption_log_id AND user_id = auth.uid())
);

-- recaps
CREATE POLICY "Party members can read recaps" ON public.recaps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.party_members WHERE party_id = recaps.party_id AND user_id = auth.uid())
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
