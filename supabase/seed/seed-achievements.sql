-- Seed achievements table with all app achievements
-- Run after migrations: psql $DATABASE_URL -f supabase/seed/seed-achievements.sql

INSERT INTO public.achievements (name, description, emoji, criteria) VALUES
  (
    'First Drink',
    'Logged your very first drink',
    '🍺',
    '{"type": "drink_count", "threshold": 1}'
  ),
  (
    'Party Starter',
    'Created your first party',
    '🎉',
    '{"type": "party_created", "threshold": 1}'
  ),
  (
    'Social Butterfly',
    'Made 5 friends',
    '🦋',
    '{"type": "friend_count", "threshold": 5}'
  ),
  (
    'Mixologist',
    'Tried 5 different cocktails',
    '🍹',
    '{"type": "unique_cocktails", "threshold": 5}'
  ),
  (
    'Beer Connoisseur',
    'Tried 5 different beers',
    '🍻',
    '{"type": "unique_beers", "threshold": 5}'
  ),
  (
    'Weekend Warrior',
    'Kept a 3-weekend streak',
    '🎩',
    '{"type": "streak_weekends", "threshold": 3}'
  ),
  (
    'Night Owl',
    'Still going at 2am',
    '🦉',
    '{"type": "last_drink_hour", "threshold": 2}'
  ),
  (
    'Hydration Hero',
    'Opened the app but stayed sober',
    '💧',
    '{"type": "sober_night", "threshold": 1}'
  )
ON CONFLICT (name) DO NOTHING;
