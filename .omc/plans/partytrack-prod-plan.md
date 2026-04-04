# PartyTrack Production Backend — Implementation Plan

**Mode:** DELIBERATE (high-risk: auth, user data, external APIs, real-time features)
**Date:** 2026-04-03
**Status:** REVISED — Architect review applied (v2)

---

## RALPLAN-DR Summary

### Principles (5)

1. **Incremental Migration** — Each phase produces a fully functional app. No big-bang cutover. Mock data is replaced one domain at a time behind feature flags.
2. **Backend-First, Frontend-Light** — Supabase schema + RLS + Edge Functions are the source of truth. Frontend stores become thin wrappers over `@supabase/supabase-js` queries. Keep business logic server-side.
3. **Security by Default** — Row-Level Security on every table from day one. No table is publicly readable without an explicit policy. Secrets live in Supabase Vault / Edge Function env vars only.
4. **Preserve the Shell** — The existing React component tree, design system, animations, and route structure are preserved. Only the data layer (stores, mock data, hooks) changes.
5. **Test Continuity** — The 86 existing tests must keep passing at every phase boundary. New Supabase-backed code gets its own test suite using mocked Supabase clients.

### Decision Drivers (top 3)

1. **Time-to-dogfood** — The fastest path to a working app with real auth and real drink logging, so real users can test the core loop (scan -> log -> BAC).
2. **Data integrity** — BAC calculation and drink logging touch health-adjacent data. Incorrect values are a liability. Server-side validation is non-negotiable.
3. **Cost control** — GPT-4o vision calls, Google Places API, and Supabase storage all have per-unit costs. Must have rate limiting and usage caps before any external API goes live.

### Viable Options

#### Option A: Vertical Slice (RECOMMENDED)

Build the full stack for one feature at a time, in dependency order. Each phase ships a complete feature from schema to UI. All 10 tables are deployed empty in Phase 0 to eliminate forward-reference RLS bugs; each subsequent phase activates the Edge Functions and frontend integration for its domain.

| Pros | Cons |
|------|------|
| Testable after each phase | Temporarily two data paths (mock + real) |
| Unblocks dogfooding after Phase 1-2 | Feature flags add small complexity |
| Rollback is per-feature | Phases 4-6 depend on earlier phases |
| Aligns with existing feature-folder structure | — |
| No forward-reference RLS bugs | — |

#### Option B: Horizontal Layer

Build all schemas first, then all Edge Functions, then all frontend integrations.

| Pros | Cons |
|------|------|
| Clean separation of concerns | Nothing works until all layers are done |
| Single migration file per phase | Hard to test incrementally |
| Simpler mental model for DB design | Long time before any user can test |
| — | Rollback is all-or-nothing |

#### Option C: Monorepo with Separate API Service

Deploy a standalone API (e.g., Express on Cloudflare Workers) in front of Supabase.

| Pros | Cons |
|------|------|
| Full control over API shape | Extra infra to maintain |
| Easier to unit-test API logic | Duplicates Supabase's built-in capabilities |
| Language/framework flexibility | Higher latency (extra hop) |
| — | Overkill for V1 feature set |

### Recommendation

**Option A (Vertical Slice)** — It delivers the fastest path to dogfooding, aligns with the existing feature-folder structure (`features/drinks`, `features/party`, etc.), and allows independent rollback per domain. Option B delays testability. Option C adds unnecessary infrastructure for a V1 that Supabase can handle natively.

### ADR

- **Decision:** Vertical slice migration — all 10 tables deployed empty in Phase 0; each subsequent phase activates Edge Functions and frontend for its domain. Supabase is the sole backend (auth, database, storage, edge functions, realtime).
- **Drivers:** Time-to-dogfood, data integrity, cost control.
- **Alternatives considered:** Horizontal layer build-out; standalone API service in front of Supabase; deploying tables phase-by-phase (rejected due to RLS forward-reference bugs).
- **Why chosen:** Deploying all tables upfront eliminates inter-phase RLS dependencies (e.g., `profiles` policy referencing `friendships`). Vertical slices still apply to Edge Functions and frontend — each phase ships a complete feature. Supabase's built-in auth, RLS, realtime, and storage eliminate the need for a custom API layer in V1.
- **BAC contract:** Client renders BAC optimistically using the Widmark formula. Server is authoritative. Client adopts the server value within one polling cycle (≤ 60s). Safety alerts fire on whichever value — client or server — is **higher** (fail-safe). Server and client implementations must share test vectors.
- **Night-end detection (V1):** Geolocation is not used as a night-end signal because `watchPosition` stops when the browser tab is backgrounded. V1 detection uses: (1) consumption inactivity > 90 min since last drink by any party member; (2) explicit "I'm done" per-user button, auto-end when all members tap it; (3) time-of-day heuristic (party started before midnight, now after 4am, 60 min inactivity). Location logging is kept for recap venue lists but not for night-end detection.
- **Recap sharing (V1):** Server-side image compositing (Sharp, etc.) is not available in Deno Edge Functions. V1 shares a link to the in-app recap story. Composite image generation is deferred to post-V1.
- **Consequences:** (1) Temporary coexistence of mock and real data paths requires feature flags. (2) Schema changes in later phases may require migrations against live tables. (3) Edge Functions lock us into Deno runtime. (4) All 10 tables are visible in the DB from day one (empty), which is intentional.
- **Follow-ups:** Evaluate moving BAC calculation to a dedicated service if regulatory requirements emerge. Revisit standalone API if Supabase Edge Functions hit performance limits at scale. Revisit server-side image generation for recap sharing post-V1.

---

## Context

### Current State

- **Frontend:** React 19 + Vite 8 + Tailwind v4 + Framer Motion + React Router 7 + Zustand 5
- **Data:** 100% mocked via `src/data/mock-*.ts` files, consumed by 3 Zustand stores (`app-store`, `drink-store`, `party-store`)
- **Types:** Well-defined in `src/types/` — `User`, `DrinkCatalogItem`, `DrinkLogEntry`, `Party`, `Invite`, `SocialPost`, `Recap`, `RecapSlide`, `Badge`, `Streak`, `SafetyAlert`, `LeaderboardEntry`, `Toast`
- **Known type issue:** `Party.memberIds: string[]` must be migrated to reflect the `party_members` junction table — addressed in Phase 3 type migration task.
- **Tests:** 86 passing (Vitest + Testing Library + jsdom), covering utils (`bac-calculator`, `xp-calculator`, `invite-code`, `format`), stores (`app-store`, `drink-store`), and components (`DrinkLogger`, `BACMeter`, `RecapStory`, `LeaderboardTab`, `SafetyMonitor`, `SocialPost`)
- **Key utility:** `bac-calculator.ts` implements Widmark formula client-side — must be reconciled with its own inline comments and duplicated server-side for authoritative BAC (see Phase 1 task).
- **Photo Recognition:** `PhotoRecognition.tsx` currently fakes identification via `setTimeout` + random catalog pick — must be replaced with GPT-4o vision pipeline
- **Design system:** `src/design-system/components/` — `SheetModal`, `Card`, `TopBar`, `ProgressBar`, `Button`, `TabBar` (preserved as-is)

### Target State

- Supabase project with 10 tables, RLS policies, Edge Functions
- Google OAuth via Supabase Auth
- GPT-4o vision drink scanning with external API enrichment
- Server-authoritative BAC via Edge Function (client optimistic, server final, alerts on higher value)
- Real-time party updates via Supabase Realtime
- Supabase Storage for media
- All Zustand stores replaced with Supabase-backed hooks

---

## Guardrails

### Must Have
- RLS on every table — no public access without explicit policy
- Server-side BAC calculation (client renders optimistically; server is authoritative; safety alerts fire on whichever value is higher)
- Input validation (Zod) on all Edge Function inputs
- Rate limiting on GPT-4o vision calls (max 20/user/hour)
- All secrets in Supabase Vault or Edge Function env vars
- Feature flags to toggle mock vs. real data per domain
- Existing 86 tests pass after every phase
- `social_feed` VIEW uses `security_invoker = on` to respect caller's RLS context

### Must NOT Have
- No payments/Stripe in V1
- No real-time location sharing (venue-level only, logged server-side)
- No public API — all access through Supabase client SDK + RLS
- No direct table access from frontend without RLS
- No client-side-only BAC as source of truth
- No hardcoded API keys in frontend code
- No geolocation as a night-end detection signal in V1 (unreliable in backgrounded tabs)
- No server-side composite image generation in V1 (Deno/Sharp not viable)

---

## Phase 0: Foundation — Supabase Project + All Tables + Auth + CI

**Goal:** Supabase project initialized with ALL 10 tables deployed (empty, with RLS), Google OAuth working, authenticated shell app, CI pipeline green.

**Why all tables upfront:** Deploying the complete relational model in Phase 0 eliminates forward-reference RLS bugs (e.g., `profiles` policy referencing `friendships` which didn't exist until Phase 3 in the previous design). Tables are empty — no data migration needed. Edge Functions and frontend integrations are still introduced phase-by-phase as a vertical slice.

### Schema (SQL Migration 001 — Complete Relational Model)

```sql
-- 001_foundation.sql
-- Deploys all 10 tables empty with RLS enabled.
-- Edge Functions and frontend integrations are activated per-phase.

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE 1: profiles (extends Supabase auth.users)
-- ============================================================
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- NOTE: friendships table exists in this same migration, so this policy
-- is safe — no forward reference.
CREATE POLICY "Users can read friends profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = profiles.id)
        OR (addressee_id = auth.uid() AND requester_id = profiles.id)
      )
    )
  );

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE 2: drink_catalog
-- ============================================================
CREATE TABLE public.drink_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  abv NUMERIC(4,1) NOT NULL,
  volume_ml INTEGER NOT NULL,
  standard_drinks NUMERIC(4,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('beer', 'cocktail', 'shot', 'wine', 'other')),
  openfoodfacts_id TEXT,
  usda_fdc_id TEXT,
  cocktaildb_id TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drink_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read catalog"
  ON public.drink_catalog FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE 3: consumption_log
-- ============================================================
CREATE TABLE public.consumption_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.drink_catalog(id),
  party_id UUID REFERENCES public.parties(id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  corrected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own consumption"
  ON public.consumption_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consumption"
  ON public.consumption_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own consumption"
  ON public.consumption_log FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Party members can read party consumption"
  ON public.consumption_log FOR SELECT
  USING (
    party_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.party_members pm1
      JOIN public.party_members pm2 ON pm1.party_id = pm2.party_id
      WHERE pm1.user_id = auth.uid()
      AND pm2.user_id = consumption_log.user_id
      AND pm1.party_id = consumption_log.party_id
    )
  );

CREATE INDEX idx_consumption_user_logged ON public.consumption_log(user_id, logged_at DESC);
CREATE INDEX idx_consumption_party ON public.consumption_log(party_id) WHERE party_id IS NOT NULL;

-- ============================================================
-- TABLE 4: corrections_log
-- ============================================================
CREATE TABLE public.corrections_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumption_id UUID NOT NULL REFERENCES public.consumption_log(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  corrected_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.corrections_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own corrections"
  ON public.corrections_log FOR SELECT
  USING (auth.uid() = corrected_by);

CREATE POLICY "Users can insert own corrections"
  ON public.corrections_log FOR INSERT
  WITH CHECK (auth.uid() = corrected_by);

-- ============================================================
-- TABLE 5: parties
-- ============================================================
CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  location_name TEXT DEFAULT '',
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  google_place_id TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members can read party"
  ON public.parties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.party_members
      WHERE party_members.party_id = parties.id
      AND party_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update party"
  ON public.parties FOR UPDATE
  USING (host_id = auth.uid());

CREATE POLICY "Authenticated users can create parties"
  ON public.parties FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE INDEX idx_party_invite_code ON public.parties(invite_code);

-- ============================================================
-- TABLE 6: party_members
-- ============================================================
CREATE TABLE public.party_members (
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('host', 'member')),
  done BOOLEAN NOT NULL DEFAULT false,  -- true when user taps "I'm done" for night-end
  PRIMARY KEY (party_id, user_id)
);

ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read party members"
  ON public.party_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.party_members AS pm
      WHERE pm.party_id = party_members.party_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join parties"
  ON public.party_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own done flag"
  ON public.party_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_party_members_user ON public.party_members(user_id);

-- ============================================================
-- TABLE 7: friendships
-- ============================================================
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() IN (requester_id, addressee_id));

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can update friendship"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_friendships_users ON public.friendships(requester_id, addressee_id);

-- ============================================================
-- TABLE 8: location_log
-- ============================================================
CREATE TABLE public.location_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES public.parties(id),
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  accuracy_m NUMERIC(6,1),
  google_place_id TEXT,
  venue_name TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.location_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own location"
  ON public.location_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location"
  ON public.location_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_location_user_party ON public.location_log(user_id, party_id);

-- ============================================================
-- TABLE 9: achievements
-- ============================================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_emoji TEXT NOT NULL DEFAULT '',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Friends can read achievements"
  ON public.achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = achievements.user_id)
        OR (addressee_id = auth.uid() AND requester_id = achievements.user_id)
      )
    )
  );

-- Achievements are server-granted only (via Edge Function with service role)
-- No direct user insert policy.

CREATE INDEX idx_achievements_user ON public.achievements(user_id);

-- ============================================================
-- TABLE 10: media
-- ============================================================
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES public.parties(id),
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  caption TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'capture' CHECK (source IN ('capture', 'camera_roll', 'scan')),
  taken_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own media"
  ON public.media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Party members can read party media"
  ON public.media FOR SELECT
  USING (
    party_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.party_members
      WHERE party_members.party_id = media.party_id
      AND party_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload own media"
  ON public.media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON public.media FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 11 (view): recaps table + social_feed view
-- ============================================================
CREATE TABLE public.recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_drinks INTEGER NOT NULL DEFAULT 0,
  peak_bac NUMERIC(4,3) DEFAULT 0,
  duration_hours NUMERIC(4,1) DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 0,
  venue_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed'))
);

ALTER TABLE public.recaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members can read recaps"
  ON public.recaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.party_members
      WHERE party_members.party_id = recaps.party_id
      AND party_members.user_id = auth.uid()
    )
  );

-- social_feed VIEW
-- security_invoker = on ensures the view respects the CALLER's RLS context,
-- not the definer's. Without this, any authenticated user would bypass the
-- media table's RLS and see all photos. Requires Postgres 15+ (Supabase default).
CREATE OR REPLACE VIEW public.social_feed WITH (security_invoker = on) AS
SELECT
  m.id,
  m.user_id,
  p.name AS user_name,
  p.avatar_url,
  m.storage_path AS image_url,
  m.caption,
  m.party_id,
  m.uploaded_at AS posted_at,
  0 AS like_count,
  0 AS comment_count
FROM public.media m
JOIN public.profiles p ON p.id = m.user_id
WHERE m.media_type = 'photo'
ORDER BY m.uploaded_at DESC;
```

### Frontend Changes

1. Install `@supabase/supabase-js`
2. Create `src/lib/supabase.ts` — singleton client initialized from env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Create `src/lib/auth-provider.tsx` — React context providing `session`, `user`, `signIn`, `signOut`
4. Create `src/hooks/use-auth.ts` — hook consuming auth context
5. Add `src/features/auth/LoginScreen.tsx` — Google OAuth button, redirects to app on success
6. Wrap `<App />` in `<AuthProvider>` in `main.tsx`; show `<LoginScreen>` when unauthenticated
7. Add feature flag util: `src/lib/feature-flags.ts` — reads from `localStorage` or env, controls mock vs. real per domain
8. Update `app-store.ts`: when auth is real, `currentUser` derives from Supabase profile; when mock, uses `CURRENT_USER` as today

### Acceptance Criteria

- [ ] `supabase login` and `supabase db push` succeed with all 10 tables created
- [ ] Google OAuth sign-in works in browser; redirects to app
- [ ] `profiles` row auto-created on first sign-in with name + avatar from Google
- [ ] RLS prevents reading other users' profiles (test with two accounts)
- [ ] Feature flag `USE_REAL_AUTH=true` toggles between mock and real user
- [ ] All 86 existing tests still pass (mock path unchanged)
- [ ] `.env.local` is in `.gitignore`; no secrets in source
- [ ] All 10 tables exist with RLS enabled (verify with `supabase inspect db policies`)

---

## Phase 1: Drink Catalog + Logging + BAC

**Goal:** Users can browse drinks, log drinks to Supabase, and see server-authoritative BAC.

**Tables used:** `drink_catalog`, `consumption_log`, `corrections_log` (all created in Phase 0)

### BAC Formula Reconciliation (do before Edge Function)

**Task:** Audit `bac-calculator.ts` — reconcile the inline comment description with the actual implementation. If they differ, fix the comment to match the code (the code is what has been tested; do not silently change behavior).

**Shared test vectors:** Define 5 canonical input/output pairs (weight, sex, drinks, hours) that both the client implementation and the `compute-bac` Edge Function must produce identical results for. Add these as a shared test fixture (`src/lib/__fixtures__/bac-test-vectors.ts`) imported by both client and server tests.

**BAC contract:**
- Client computes BAC immediately on drink log for optimistic display
- Edge Function (`compute-bac`) is the authoritative source
- Client adopts the server value within one polling cycle (≤ 60s)
- Safety alerts (`SafetyMonitor`, push notifications) fire on whichever value — client or server — is **higher** (fail-safe behavior)
- Log server vs. client BAC delta; alert if divergence > 0.01

### Edge Functions

1. **`compute-bac`** — POST, receives `{ user_id }`, queries `consumption_log` + `profiles` + `drink_catalog`, runs Widmark formula server-side using the same logic as the reconciled `bac-calculator.ts`, returns `{ bac: number, level: SafetyLevel, drinks_tonight: number }`. Validates that requesting user is the same user or a party member.

2. **`seed-catalog`** — One-time admin function to insert the 22 drinks from `mock-drinks.ts` into `drink_catalog` with `is_verified = true`.

### Frontend Changes

1. Create `src/lib/repositories/drink-repository.ts` — implements Repository pattern over Supabase: `fetchCatalog()`, `logDrink(catalogItemId)`, `removeDrink(entryId)`, `fetchLog(since)`, `fetchBAC()`
2. Replace `drink-store.ts`:
   - When `USE_REAL_DRINKS=true`: catalog from Supabase, `addDrink` inserts into `consumption_log`, `removeDrink` deletes, BAC fetched from Edge Function
   - When flag is off: existing mock behavior preserved
3. Update `BACMeter.tsx` to poll `compute-bac` every 60s (or use Supabase Realtime on `consumption_log` changes); display optimistic client BAC immediately, replace with server value on response
4. Update `DrinkLogger.tsx` to use repository
5. `SafetyMonitor.tsx` must use `Math.max(clientBAC, serverBAC)` as the trigger value

### Acceptance Criteria

- [ ] BAC formula comment and implementation agree in `bac-calculator.ts`
- [ ] Shared test vectors file exists; client and `compute-bac` Edge Function both pass all vectors
- [ ] Drink catalog loads from Supabase (22 seeded drinks)
- [ ] Logging a drink inserts a row in `consumption_log`
- [ ] Removing a drink deletes the row
- [ ] `compute-bac` Edge Function returns correct BAC matching Widmark test vectors
- [ ] BAC updates within 60s of logging a drink
- [ ] Safety alerts fire on the higher of client or server BAC
- [ ] RLS prevents reading other users' consumption logs
- [ ] Corrections log captures edits
- [ ] New tests: drink-repository unit tests (mocked Supabase client), compute-bac Edge Function integration test, shared test vector coverage
- [ ] All 86 original tests still pass

---

## Phase 2: AI Drink Scanning

**Goal:** PhotoRecognition uses GPT-4o vision to identify drinks, enriches with external APIs, user confirms/edits before logging.

**Tables used:** `drink_catalog`, `consumption_log` (Phase 0)

### Edge Functions

1. **`scan-drink`** — POST, receives `{ image_base64: string }`:
   - Calls GPT-4o vision with prompt: "Identify this alcoholic beverage. Return JSON: { name, category, estimated_abv, estimated_volume_ml, confidence }"
   - If confidence > 0.7: searches OpenFoodFacts API by name for exact ABV/volume
   - Fallback: searches USDA FoodData Central
   - For cocktails: searches TheCocktailDB for recipe/ABV
   - Returns `{ identified: DrinkCatalogItem | null, confidence: number, source: string, suggestions: DrinkCatalogItem[] }`
   - Rate limited: 20 calls/user/hour via Redis counter (or Supabase table-based counter)
   - Input validation: image must be < 5MB, valid base64

### Frontend Changes

1. Replace `PhotoRecognition.tsx` fake `setTimeout` scan with real flow:
   - Capture image from camera (use `navigator.mediaDevices.getUserMedia`)
   - Send base64 to `scan-drink` Edge Function
   - Show identified drink with confidence score
   - Allow user to confirm, edit (name/ABV/volume), or reject
   - On confirm: if drink not in catalog, insert into `drink_catalog` with `is_verified = false` and `created_by = user_id`; then log via `drink-repository.logDrink()`
2. Create `src/features/drinks/ScanConfirmSheet.tsx` — edit/confirm UI for scanned drink
3. Add rate limit feedback: show remaining scans and cooldown timer

### Acceptance Criteria

- [ ] Camera captures image and sends to Edge Function
- [ ] GPT-4o vision returns drink identification with confidence
- [ ] External API enrichment improves ABV/volume accuracy
- [ ] User can confirm, edit, or reject identification
- [ ] Confirmed new drinks are added to catalog with `is_verified = false`
- [ ] Rate limiting enforced: 429 response after 20 scans/hour
- [ ] Error states: no camera, API timeout, low confidence, rate limited
- [ ] New tests: scan-drink Edge Function unit tests (mocked GPT-4o), ScanConfirmSheet component tests
- [ ] Existing tests unaffected

---

## Phase 3: Parties + Social Graph + Invites

**Goal:** Users can create/join parties, send friend requests, use frictionless invite links. Party members see each other's drink counts and BAC levels.

**Tables used:** `parties`, `party_members`, `friendships` (all Phase 0)

### Type Migration Task (do before repository work)

`Party.memberIds: string[]` in `src/types/` must be updated to reflect the `party_members` junction table shape. The flat array of IDs is replaced by a richer structure (e.g., `members: PartyMember[]` where `PartyMember = { userId: string; role: 'host' | 'member'; joinedAt: string; done: boolean }`).

Steps:
1. Update the `Party` type definition
2. Search all consumers of `party.memberIds` (`party-store.ts`, `PartyLobby.tsx`, `InviteCode.tsx`, mock data, tests) and update each
3. Update mock data to use the new shape so existing tests continue to pass
4. Add to acceptance criteria: zero TypeScript errors after type migration

### Edge Functions

1. **`join-party`** — POST `{ invite_code }`: looks up party, inserts into `party_members`, returns party details. Handles the frictionless flow: if user is not signed up, returns a redirect URL that, after OAuth, auto-joins the party (invite code stored in URL query param, processed by auth callback).

2. **`end-party`** — POST `{ party_id }`: host-only, sets `status = 'ended'`, sets `end_time`, triggers recap generation (Phase 6).

3. **`mark-done`** — POST `{ party_id }`: sets `party_members.done = true` for the calling user. If ALL members of the party have `done = true`, calls `end-party` automatically. This is the manual "I'm done" signal for night-end detection.

### Frontend Changes

1. Create `src/lib/repositories/party-repository.ts` — `createParty()`, `joinByInviteCode()`, `leaveParty()`, `fetchActiveParty()`, `fetchPastParties()`, `fetchMembers()`
2. Create `src/lib/repositories/social-repository.ts` — `sendFriendRequest()`, `acceptRequest()`, `blockUser()`, `fetchFriends()`, `fetchPendingRequests()`
3. Replace `party-store.ts` with Supabase-backed version:
   - `activeParty` from Supabase query where user is member and status = 'active'
   - `createParty` inserts into `parties` + `party_members`
   - `joinParty` calls `join-party` Edge Function
   - Subscribe to Supabase Realtime on `party_members` for live member join/leave
4. Update `InviteCode.tsx` to generate shareable deep link: `https://partytrack.app/join?code=XXXXXX`
5. Update `PartyLobby.tsx` to show real member list with live BAC from `compute-bac`
6. Add `/join` route in `App.tsx` that handles invite code from URL
7. Add "I'm done" button in party UI — calls `mark-done` Edge Function; show how many members are done vs. total

### Acceptance Criteria

- [ ] `Party` type migrated to junction-table shape; zero TypeScript errors; existing tests pass
- [ ] Create party inserts into `parties` + `party_members` (host role)
- [ ] Invite code link works: open link -> sign in -> auto-join party
- [ ] Party members see each other's profiles and drink counts in real-time
- [ ] Friend request flow: send -> pending -> accept/block
- [ ] RLS prevents non-members from reading party data
- [ ] Supabase Realtime updates party member list without refresh
- [ ] Leaving a party removes from `party_members`
- [ ] Host can end party
- [ ] "I'm done" button sets `done = true`; party auto-ends when all members tap it
- [ ] New tests: party-repository, social-repository, join-party Edge Function, mark-done Edge Function
- [ ] Existing tests pass

---

## Phase 4: Location + Gamification + Achievements

**Goal:** GPS logging at venue level, Google Places venue matching, XP/streaks/achievements persisted to Supabase.

**Tables used:** `location_log`, `achievements` (Phase 0)

### Edge Functions

1. **`log-location`** — POST `{ latitude, longitude, accuracy_m, party_id? }`: validates coords, calls Google Places Nearby Search to find matching venue (radius 50m), stores venue info. Rate limited to 1 call/5min/user. Location is logged for recap venue lists — it is NOT used for night-end detection.

2. **`award-achievement`** — Internal function (called by other Edge Functions, not directly by client). Checks achievement conditions against user's data and inserts into `achievements` if earned. Called after drink logging, party events, streak updates.

3. **`update-streak`** — Cron-triggered (Sunday midnight UTC). Scans `consumption_log` for weekend activity, updates `profiles.streak_weekends` and `profiles.last_active_weekend`. Awards streak badges.

4. **`compute-leaderboard`** — POST `{ party_id?, period }`: aggregates drink counts and XP for the requested scope (tonight/weekend/alltime, party or friends). Returns ranked list.

### Frontend Changes

1. Create `src/lib/repositories/location-repository.ts` — `logLocation()`, `fetchVenue(partyId)`
2. Create `src/lib/repositories/achievement-repository.ts` — `fetchAchievements(userId)`, `fetchLeaderboard(period, scope)`
3. Add background geolocation logging (Geolocation API `watchPosition` with `enableHighAccuracy: false`, throttled to 5min intervals during active party). Note: this data is for recap venue lists only — not used for night-end detection, so tab-backgrounding limitations don't affect correctness.
4. Update `ProfileStats.tsx` to read from `achievements` table
5. Update `StreakTracker.tsx` to read from `profiles.streak_weekends`
6. Update `XPSystem.tsx` and `AchievementUnlock.tsx` to show real achievements
7. Replace leaderboard in `drink-store.ts` with `compute-leaderboard` Edge Function call
8. Update `LeaderboardTab.tsx`, `LeaderboardRow.tsx`, `LeaderboardFilters.tsx` to use real data

### Acceptance Criteria

- [ ] Location logged at venue level during active party (not shared with other users)
- [ ] Google Places resolves venue name from coordinates
- [ ] Achievements persist across sessions
- [ ] Streak calculation runs on schedule and updates profile
- [ ] Leaderboard shows real rankings for tonight/weekend/alltime
- [ ] XP awards persist to `profiles.xp` and `profiles.level`
- [ ] Achievement badges display on profile with unlock timestamps
- [ ] Rate limiting on location logging (1/5min) and Places API
- [ ] New tests: location-repository, achievement-repository, streak Edge Function
- [ ] Existing tests pass

---

## Phase 5: Media Storage + Social Feed

**Goal:** Photos/videos stored in Supabase Storage, social feed shows real posts from party members.

**Tables used:** `media` (Phase 0); `social_feed` VIEW (Phase 0, `security_invoker = on`)

### Supabase Storage

1. Create bucket `party-media` with policies:
   - Authenticated users can upload to `{user_id}/` prefix
   - Party members can read files from party members' prefixes
   - Max file size: 10MB photos, 50MB videos
2. Create bucket `avatars` for profile photos

### Frontend Changes

1. Create `src/lib/repositories/media-repository.ts` — `uploadPhoto(file, partyId?)`, `uploadVideo(file, partyId?)`, `fetchPartyMedia(partyId)`, `deleteMedia(id)`
2. Update `SocialTab.tsx` and `SocialFeed.tsx` to query `social_feed` view
3. Update `SocialPost.tsx` to render real storage URLs
4. Update `CameraRollSync.tsx` to upload selected photos to Supabase Storage with `source = 'camera_roll'`
5. Update `ShareSheet.tsx` to share real URLs
6. Add image compression before upload (client-side, max 1920px width, 80% quality JPEG)

### Acceptance Criteria

- [ ] Photos upload to Supabase Storage under `party-media/{user_id}/`
- [ ] Storage policies enforce user-scoped uploads
- [ ] Social feed shows real photos from party members (only media visible to the caller per RLS — verified by `security_invoker = on` on the view)
- [ ] Camera roll sync uploads selected photos with correct `taken_at` metadata
- [ ] Image compression reduces file size before upload
- [ ] File size limits enforced (10MB photo, 50MB video)
- [ ] Media deletion removes both storage object and database row
- [ ] RLS integration test: User A cannot see User B's private photos via `social_feed` view
- [ ] New tests: media-repository unit tests, upload flow integration test
- [ ] Existing tests pass

---

## Phase 6: Night-End Detection + Recaps

**Goal:** Multi-signal night-end detection triggers recap generation for all party members. Spotify Wrapped-style stories from aggregated party data.

**Tables used:** `recaps`, `consumption_log`, `party_members` (all Phase 0)

### Night-End Detection Design (V1)

Geolocation is **not** a night-end detection signal in V1. `watchPosition` stops when the browser tab is backgrounded, making it unreliable as a trigger. Location data is still logged for recap venue lists (Phase 4) but not used here.

**V1 detection signals (evaluated every 15 min, midnight–6am):**

| Signal | Condition | Weight |
|--------|-----------|--------|
| Consumption inactivity | > 90 min since last drink logged by ANY party member | Primary |
| Manual "I'm done" | All party members have `party_members.done = true` | Auto-end immediately (no cron needed) |
| Time-of-day heuristic | Party started before midnight AND current time > 4am AND > 60 min inactivity | Secondary |

**Auto-end logic:**
- Manual: `mark-done` Edge Function auto-ends as soon as all members are done (Phase 3)
- Cron: `detect-night-end` fires every 15 min (midnight–6am). Ends party if EITHER: consumption inactivity > 90 min OR time-of-day heuristic met. Does NOT check location.
- Party duration must be > 2 hours before auto-end is eligible (prevents accidental early end)

### Schema (SQL Migration 002 — none needed)

All tables for this phase were created in Phase 0. No new migration required.

### Edge Functions

1. **`detect-night-end`** — Cron (every 15 min, midnight–6am UTC). For each active party (duration > 2h), checks:
   - Any consumption in last 90 min by any member? If no → end party
   - Party started before midnight, now after 4am, 60 min since last consumption? → end party
   - Calls `end-party` internally; `end-party` triggers recap generation

2. **`generate-recap`** — Triggered by party end. Aggregates:
   - Total drinks per member from `consumption_log`
   - Peak BAC from `compute-bac` history
   - Duration from `parties.start_time` to `end_time`
   - Top drink categories
   - Media highlights (most recent 5 photos)
   - Venue info from `location_log` (for display in recap, not for detection)
   - Generates `RecapSlide[]` JSON: `stat-reveal`, `group-photo`, `drink-breakdown`, `peak-moment`
   - Stores in `recaps.slides` as JSONB

### Frontend Changes

1. Create `src/lib/repositories/recap-repository.ts` — `fetchRecap(partyId)`, `fetchRecaps()`
2. Replace `recaps` in `party-store.ts` with Supabase-backed query
3. Update `RecapTab.tsx` to fetch real recaps
4. Update `RecapStory.tsx` and `RecapSlide.tsx` to render real data (media URLs from storage, real stats)
5. Update `RecapStats.tsx` to show real aggregated stats
6. **`RecapShare.tsx`** — V1 shares a **link to the in-app recap story** (`https://partytrack.app/recap/{party_id}`), not a composited image. Server-side image compositing (Sharp, etc.) is not available in Deno Edge Functions; deferred to post-V1. The share sheet uses the Web Share API with the recap URL and a text summary.

### Acceptance Criteria

- [ ] Night-end fires on consumption inactivity > 90 min (cron path)
- [ ] Night-end fires immediately when all members tap "I'm done" (manual path)
- [ ] Time-of-day heuristic triggers after 4am with 60 min inactivity
- [ ] Geolocation is not evaluated for night-end (confirmed by code review)
- [ ] Party auto-ends and recap generation begins
- [ ] Recap contains accurate drink counts, peak BAC, duration, venue
- [ ] RecapStory renders with real photos and stats
- [ ] Recap is visible to all party members
- [ ] Manual "end party" (host) also triggers recap generation
- [ ] Recap generation handles edge cases: solo party, no photos, no location data
- [ ] `RecapShare.tsx` shares the in-app recap URL via Web Share API (no composite image)
- [ ] New tests: detect-night-end logic (all three signal paths), generate-recap aggregation, recap-repository
- [ ] Existing tests pass

---

## Phase 7: Cleanup + Hardening

**Goal:** Remove all mock data paths, remove feature flags, performance optimization, security audit.

### Tasks

1. **Remove mock data:** Delete `src/data/mock-*.ts` files. Remove all feature flag conditionals. Stores now exclusively use Supabase.
2. **Remove Zustand:** Replace remaining Zustand stores with custom hooks over Supabase queries (or keep Zustand as client-side cache with Supabase as source of truth — decision deferred to execution).
3. **Error boundaries:** Add React error boundaries around each feature tab. Global error boundary in `App.tsx`.
4. **Loading states:** Replace `TabSkeleton` with feature-specific skeleton screens.
5. **Offline support:** Cache last-known BAC and drink log in `localStorage`. Show stale indicator when offline. Queue drink logs for sync on reconnect.
6. **Performance:**
   - Supabase query optimization: add missing indexes based on query patterns
   - Image lazy loading in social feed
   - Debounce BAC polling
   - Bundle analysis: ensure Supabase SDK is tree-shaken
7. **Security audit:**
   - Verify all RLS policies with integration tests
   - Verify `social_feed` view `security_invoker = on` is in place (grep migration for the option)
   - Audit Edge Function input validation
   - Verify no secrets in client bundle
   - Rate limit audit on all external API calls
   - CORS configuration review
8. **Update tests:** Remove mock-dependent tests, replace with Supabase-mocked equivalents. Target 80%+ coverage.

### Acceptance Criteria

- [ ] No `mock-*.ts` imports remain in production code
- [ ] App works end-to-end with only Supabase (no mock fallbacks)
- [ ] Error boundaries catch and display errors gracefully
- [ ] Offline mode shows cached data with stale indicator
- [ ] All RLS policies verified via integration tests
- [ ] `social_feed` VIEW confirmed to use `security_invoker = on`
- [ ] No secrets in client bundle (verified via build output scan)
- [ ] Test coverage >= 80%
- [ ] Bundle size < 500KB gzipped (excluding images)
- [ ] Lighthouse performance score >= 90

---

## Pre-Mortem: 3 Failure Scenarios (DELIBERATE)

### Scenario 1: RLS Policy Misconfiguration Leaks User Data

**What happens:** A missing or overly permissive RLS policy allows User A to read User B's consumption log, location data, or profile details. This is discovered after launch when a user notices other people's drinks in their feed.

**Likelihood:** MEDIUM — complex multi-table policies (party membership checks) are easy to get wrong.

**Mitigation:**
- All RLS policies are deployed in a single Phase 0 migration — no forward-reference risk
- `social_feed` VIEW uses `security_invoker = on` to prevent view-level RLS bypass
- Dedicated integration test suite: for each table, test with two users that unauthorized reads/writes are rejected
- Pre-launch security review with `supabase inspect db policies`
- Use Supabase's "Test RLS" feature in dashboard during development
- Edge Functions use service role only when necessary and validate caller identity explicitly

### Scenario 2: GPT-4o Vision Cost Explosion

**What happens:** Users discover the scan feature is fun and spam it. 1000 users * 20 scans/night = 20,000 GPT-4o vision calls/night at ~$0.01/call = $200/night. With viral growth, this scales to thousands/day.

**Likelihood:** HIGH — novel, fun feature with no natural friction.

**Mitigation:**
- Hard rate limit: 20 scans/user/hour, enforced server-side in Edge Function
- Usage tracking table: log every GPT-4o call with cost estimate
- Daily cost alert: Edge Function cron checks daily spend, alerts via webhook if > $50
- Client-side cooldown UI: show remaining scans and timer
- Fallback: if GPT-4o is unavailable or rate-limited, allow manual drink selection (existing catalog UI)
- Future: fine-tuned smaller model for common drinks, GPT-4o only for unknowns

### Scenario 3: Night-End Detection False Positives / Missed Ends

**What happens (V1 design):** The cron-based detector incorrectly ends a party due to a lull in drink logging (e.g., group is dancing, not drinking). Or the party genuinely winds down but no one taps "I'm done" and the heuristics don't fire until 4am.

**Likelihood:** MEDIUM — consumption inactivity is a blunt signal.

**Mitigation:**
- Manual "I'm done" path is always available and is the primary intended UX; cron is a fallback
- Require party duration > 2 hours before auto-end is eligible
- Host override: push notification to host before auto-ending (15-minute snooze option) — if implementable within V1 scope
- "Reopen party" feature: host can reactivate an auto-ended party within 2 hours
- Conservative defaults: only run detection between midnight–6am
- Post-launch: analyze false positive rate from `detect-night-end` logs; tune thresholds before V2

---

## Expanded Test Plan (DELIBERATE)

### Unit Tests (Vitest)

| Area | Tests | Priority |
|------|-------|----------|
| `bac-calculator.ts` | Existing tests preserved; reconcile comment/implementation; shared test vectors pass | P0 |
| `xp-calculator.ts` | Existing tests preserved | P0 |
| `invite-code.ts` | Existing tests preserved | P0 |
| `drink-repository.ts` | Mock Supabase client; test CRUD operations, error handling | P0 |
| `party-repository.ts` | Mock Supabase client; test create/join/leave/fetch | P0 |
| `social-repository.ts` | Mock Supabase client; test friend request lifecycle | P1 |
| `media-repository.ts` | Mock Supabase client; test upload/fetch/delete | P1 |
| `recap-repository.ts` | Mock Supabase client; test fetch/render data | P1 |
| `location-repository.ts` | Mock Supabase client; test log/fetch | P2 |
| `achievement-repository.ts` | Mock Supabase client; test fetch/display | P2 |
| `feature-flags.ts` | Test toggle behavior, localStorage persistence | P0 |
| `auth-provider.tsx` | Test session state transitions, sign-in/sign-out | P0 |

### Integration Tests (Vitest + Supabase local)

| Area | Tests | Priority |
|------|-------|----------|
| RLS policies | For each table: test authorized/unauthorized read/write with 2+ users | P0 |
| `social_feed` VIEW RLS | Verify User A cannot see User B's private photos via the view | P0 |
| `compute-bac` Edge Function | Send consumption data, verify BAC matches shared test vectors | P0 |
| `scan-drink` Edge Function | Mock GPT-4o response, verify enrichment pipeline | P0 |
| `join-party` Edge Function | Test invite code lookup, auto-join, invalid code | P0 |
| `mark-done` Edge Function | All done -> auto-end; partial done -> no end | P0 |
| `generate-recap` Edge Function | Test aggregation with known data, verify slide generation | P1 |
| `detect-night-end` Edge Function | Test inactivity signal, time heuristic, manual path | P1 |
| Auth flow | Google OAuth mock -> profile creation -> session | P0 |
| Supabase Realtime | Subscribe to party_members changes, verify events | P1 |

### E2E Tests (Playwright)

| Flow | Steps | Priority |
|------|-------|----------|
| Sign-in | Google OAuth -> profile created -> lands on Party tab | P0 |
| Drink logging | Open drinks tab -> select drink -> log -> BAC updates | P0 |
| Party creation | Create party -> get invite code -> share link | P0 |
| Party join via invite | Open invite link -> sign in -> auto-join -> see members | P0 |
| Night-end manual | All members tap "I'm done" -> party ends -> recap generates | P0 |
| Drink scan | Open scanner -> capture photo -> see result -> confirm -> logged | P1 |
| Friend request | Send request -> other user accepts -> appears in friends list | P1 |
| Recap viewing | End party -> recap generates -> view story slides | P1 |
| Recap sharing | Share recap -> Web Share API opens with in-app URL | P1 |
| Profile + achievements | View profile -> see XP, level, badges, streak | P2 |

### Observability

| Signal | Implementation | Priority |
|--------|---------------|----------|
| Edge Function latency | Supabase dashboard metrics + custom `console.time` logs | P0 |
| GPT-4o call tracking | Log every call: user_id, latency, cost_estimate, success/fail | P0 |
| Error rates | Supabase Edge Function error logs -> alert on > 5% error rate | P0 |
| BAC computation accuracy | Log server vs. client BAC delta; alert if > 0.01 divergence | P1 |
| Storage usage | Monitor Supabase Storage dashboard; alert at 80% quota | P1 |
| RLS denial tracking | Log policy denials in Edge Functions for debugging | P1 |
| Night-end detection accuracy | Log signals and outcomes; manual review of false positives | P2 |
| Realtime connection health | Monitor WebSocket reconnects; alert on > 10/min/user | P2 |

---

## Dependency Graph

```
Phase 0 (All 10 Tables + Auth + CI)
  |
  v
Phase 1 (Drinks + BAC + Formula Reconciliation)
  |
  v
Phase 2 (AI Scanning)     Phase 3 (Parties + Social + Type Migration)
  |                            |
  +----------------------------+
  |
  v
Phase 4 (Location + Gamification)
  |
  v
Phase 5 (Media + Social Feed)
  |
  v
Phase 6 (Night-End + Recaps)
  |
  v
Phase 7 (Cleanup + Hardening)
```

**Notes:**
- Phase 0 now creates ALL 10 tables in one migration to prevent RLS forward-reference bugs
- Phases 2 and 3 can run in parallel after Phase 1 is complete
- Phase 4 depends on both Phase 2 (drink data for achievements) and Phase 3 (party context for location)
- Phases 5 and 6 are sequential (recaps need media)

---

## External API Keys Required

| Service | Env Var | Where Used | Cost Model |
|---------|---------|-----------|------------|
| Supabase | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend client | Free tier -> Pro ($25/mo) |
| Supabase Service Role | `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions only | Included |
| Google OAuth | Configured in Supabase Dashboard | Auth provider | Free |
| OpenAI (GPT-4o) | `OPENAI_API_KEY` | `scan-drink` Edge Function | ~$0.01/image |
| Google Places | `GOOGLE_PLACES_API_KEY` | `log-location` Edge Function | $17/1000 calls |
| OpenFoodFacts | None (public API) | `scan-drink` Edge Function | Free |
| USDA FoodData Central | `USDA_API_KEY` | `scan-drink` Edge Function | Free |
| TheCocktailDB | None (public API) | `scan-drink` Edge Function | Free |

---

## Success Criteria (Overall)

- [ ] User can sign in with Google, create a party, invite friends via link, log drinks, and see live BAC
- [ ] AI drink scanning identifies drinks with > 70% accuracy on common beverages
- [ ] BAC is server-authoritative; client adopts server value within 60s; safety alerts fire on the higher value
- [ ] Night ends are detected within 15 min of all signals met (cron) or immediately (manual)
- [ ] All data is protected by RLS — no unauthorized access possible
- [ ] `social_feed` VIEW respects caller's RLS via `security_invoker = on`
- [ ] Test coverage >= 80% across unit + integration + E2E
- [ ] No hardcoded secrets in client bundle
- [ ] App loads in < 3s on 4G connection
- [ ] All 10 Supabase tables have RLS enabled with tested policies (deployed in Phase 0)

---

## Architect Review Notes (applied in v2)

The following issues were identified and resolved in this revision:

| ID | Severity | Issue | Resolution |
|----|----------|-------|-----------|
| HIGH-1 | HIGH | `profiles` RLS policy referenced `public.friendships` which didn't exist until Phase 3 | Deploy all 10 tables in Phase 0 as a single migration; friendships is in scope when profiles policy runs |
| HIGH-2 | HIGH | `social_feed` VIEW bypassed RLS on `media` table (views don't inherit RLS) | Use `CREATE VIEW ... WITH (security_invoker = on)` (Postgres 15+, Supabase supported) |
| MEDIUM-3 | MEDIUM | `watchPosition` stops when tab is backgrounded; geolocation unreliable for night-end | Drop geolocation from night-end signals; use consumption inactivity + manual "I'm done" + time heuristic |
| MEDIUM-4 | MEDIUM | `bac-calculator.ts` comment and implementation may describe different formulas | Add reconciliation task to Phase 1; define shared test vectors; document client-optimistic/server-authoritative contract with fail-safe (higher value wins) |
| MEDIUM-5 | MEDIUM | `Party.memberIds: string[]` incompatible with `party_members` junction table | Add explicit type migration task to Phase 3; update all consumers; add zero-TS-errors acceptance criterion |
| MEDIUM-6 | MEDIUM | No spec for composite image generation; Deno Edge Functions can't run Sharp | V1 shares in-app recap URL via Web Share API; composite image generation deferred to post-V1 |
