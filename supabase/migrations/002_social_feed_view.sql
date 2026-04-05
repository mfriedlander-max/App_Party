CREATE OR REPLACE VIEW public.social_feed WITH (security_invoker = on) AS
SELECT
  m.id,
  m.user_id,
  m.party_id,
  m.type,
  m.storage_url,
  m.captured_at,
  m.metadata,
  p.name AS user_name,
  p.avatar_url AS user_avatar
FROM public.media m
JOIN public.profiles p ON p.id = m.user_id
ORDER BY m.captured_at DESC;
