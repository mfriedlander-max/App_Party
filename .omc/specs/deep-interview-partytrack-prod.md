# Deep Interview Spec: PartyTrack Production Backend

## Metadata
- Interview ID: partytrack-prod-001
- Rounds: 9
- Final Ambiguity Score: 14%
- Type: brownfield
- Generated: 2026-04-04
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.92 | 0.35 | 0.322 |
| Constraint Clarity | 0.85 | 0.25 | 0.2125 |
| Success Criteria | 0.82 | 0.25 | 0.205 |
| Context Clarity | 0.80 | 0.15 | 0.12 |
| **Total Clarity** | | | **0.86** |
| **Ambiguity** | | | **14%** |

## Goal
Build a production Supabase backend for the existing App_Party React web app, replacing all mocked data with real infrastructure: Google OAuth authentication, AI-powered drink photo scanning (GPT-4o vision + drink database lookup), live BAC calculation via Widmark formula, social graph with friend requests and invite links, venue-level location tracking, gamification (XP/streaks/achievements), and Spotify Wrapped-style night recaps compiled from drink scans, camera roll sync, and in-app captures. Monetization deferred to post-PMF. All features ship in waves, each fully functional before moving to the next.

## Constraints
- **Platform:** Existing React web app (Vite + Tailwind v4), styled as mobile — NOT a native app rebuild
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **Auth:** Supabase Auth with Google OAuth (Gmail sign-in)
- **AI Vision:** GPT-4o (Cal AI-style pipeline) — photo → LLM identifies drink type/brand/vessel/fill → database lookup for ABV → user confirms/edits → log
- **Drink Database:** OpenFoodFacts (branded) + USDA FoodData Central (generic) + TheCocktailDB (cocktails) — curated and cached in Supabase
- **Location:** Real GPS via browser geolocation API, matched to venues via Google Places API
- **Payments:** Deferred — no Stripe in V1. Focus on features first, monetize after product-market fit
- **Privacy:** No real-time location sharing between users in V1. Aggregated venue-level data only in recaps
- **Media Storage:** Supabase Storage for drink scan photos, in-app captures, and synced camera roll photos

## Non-Goals (V1)
- Stripe/payment integration (deferred to post-PMF)
- Real-time location sharing between users (V2 "Night Groups" feature)
- Native iOS/Android app (web app serves as the product)
- Custom fine-tuned vision model (use GPT-4o out of the box)
- Push notifications (web notifications only if feasible)

## Acceptance Criteria

### Authentication
- [ ] User can sign up and sign in via Google OAuth (Supabase Auth)
- [ ] Profile is auto-created on first sign-in with default biometrics
- [ ] User can update profile (name, avatar, height, weight, sex) and changes persist

### AI Drink Scanning
- [ ] User takes/uploads a photo → sent to GPT-4o vision API
- [ ] GPT-4o returns: drink type, brand (if visible), vessel type, estimated fill level
- [ ] System looks up ABV from drink database (OpenFoodFacts/USDA/TheCocktailDB)
- [ ] Confirmation popup shows: drink identity, alcohol %, container type, fill level — all editable
- [ ] User corrections are stored in a corrections table for future improvement
- [ ] On confirm: drink logged to consumption_log, BAC recalculated, XP awarded
- [ ] Edge case: "Borg" or unidentifiable drinks get a database average with user edit option

### Live BAC Calculator
- [ ] BAC calculated server-side via Supabase Edge Function using Widmark formula
- [ ] Uses user's stored biometrics (weight, sex) + consumption_log timestamps
- [ ] BAC decays over time (0.015/hour) — recalculated on each drink log and periodically
- [ ] Frontend receives updated BAC and displays on gauge
- [ ] Safety alerts trigger at BAC >= 0.06 (warning) and >= 0.08 (danger)

### Social Graph
- [ ] Friend request/accept/block model (friendships table)
- [ ] Invite links: tapping link opens web app, prompts Google sign-up if new, auto-joins party — frictionless
- [ ] Invite link also recommends downloading the native app (future)
- [ ] Friends appear on leaderboards, in party lobbies, and in recaps

### Location Tracking
- [ ] GPS coordinates logged to location_log table while app is active during a night out
- [ ] Coordinates matched to venues via Google Places API (venue-level granularity)
- [ ] No real-time location sharing between users
- [ ] Venue visit history appears in night recaps

### Night-End Detection
- [ ] Multi-signal detection: user arrives home (GPS matches home location), phone stops moving, extended inactivity
- [ ] Night ends for the group when all party members have stopped activity
- [ ] Triggers recap compilation for all participants

### Night Wrap / Recap
- [ ] Spotify Wrapped-style swipeable story format
- [ ] Content: total drinks, BAC timeline, venues visited, peak moment, superlatives
- [ ] Media sources: drink scan photos + camera roll sync (photos from party timeframe) + in-app capture button
- [ ] Photo/video collage page
- [ ] Shareable to Instagram/Snapchat (screenshot-optimized cards)
- [ ] Sent as notification next morning (10am-12pm)

### Gamification
- [ ] XP awarded for: logging drinks, scanning new drink types, adding friends
- [ ] Weekend streaks: consecutive weekends with app usage
- [ ] Achievements: milestone-based (e.g., "Tried 10 beers", "First sober night", "Party Animal")
- [ ] XP/level/badges persist in profiles table and display on profile

### Permissions
- [ ] Camera permission requested for drink scanning (real browser API)
- [ ] Photo library access for camera roll sync (photos from party timeframe)
- [ ] Location permission for venue tracking
- [ ] All permissions revocable and re-requestable from settings

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| Frontend is iOS/Android native | "Existing app is React web, not native" | Keep as web app, build backend to serve it |
| Need Stripe in V1 | "Paywall kills adoption before network effects" | Defer monetization to post-PMF |
| One AI provider | "Claude or GPT-4o?" | GPT-4o (Cal AI approach), may dual-test later |
| Users always get scans right | "What if AI is wrong?" | Confirmation popup with inline editing, corrections stored |
| Heatmap is enough for location | "How granular?" | Venue-level via Google Places, not raw coordinates |
| Night ends on a timer | "How to detect end of night?" | Multi-signal: home arrival, phone inactivity, motion stopped |
| Recap photos come from scans only | "Where do media come from?" | All sources: scan photos + camera roll sync + in-app capture |
| Invite requires existing account | "Friction for new users?" | Sign-up + join in one frictionless flow via invite link |

## Technical Context (Brownfield)
- **Existing Frontend:** React 19 + Vite + Tailwind v4 + Zustand + Framer Motion at `/Users/maxfriedlander/code/apps/App_Party/`
- **Current State:** Fully mocked UI with 6 features, 86 tests, design system, dark/light theme
- **Migration Path:** Replace Zustand stores with Supabase client queries + realtime subscriptions. Keep design system and components. Replace mock data files with Supabase tables.
- **Stores to Replace:** `useAppStore` (user → Supabase auth + profiles), `useDrinkStore` (drinks → consumption_log + drink_catalog), `usePartyStore` (parties → parties table + social feed)

## Data Model (Supabase Schema)

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | references auth.users |
| avatar_url | text | Supabase Storage URL or DiceBear fallback |
| display_name | text | |
| height_cm | int | For BAC calculation |
| weight_kg | int | For BAC calculation |
| sex | text | 'male' or 'female' — Widmark constant |
| xp | int | Gamification |
| level | int | Derived from XP |
| streak_weekends | int | Consecutive active weekends |
| achievements | uuid[] | References achievements table |
| lifetime_consumption_grams | float | Running total |
| home_location | point | For night-end detection |
| created_at | timestamptz | |

### consumption_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| user_id | uuid | references profiles |
| party_id | uuid | nullable, references parties |
| timestamp | timestamptz | When drink was logged |
| drink_type | text | AI-identified or user-corrected |
| estimated_alcohol_grams | float | Computed from ABV + volume |
| abv | float | Alcohol by volume percentage |
| volume_ml | float | Estimated volume |
| vessel_type | text | shot glass, wine glass, solo cup, etc. |
| fill_level | float | 0.0-1.0 |
| image_url | text | Supabase Storage URL |
| is_manual_entry | boolean | |
| ai_raw_response | jsonb | Original GPT-4o output |
| user_corrections | jsonb | Diff of what user changed |

### drink_catalog (cached lookup)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | |
| brand | text | nullable |
| category | text | beer, cocktail, shot, wine, spirit, other |
| abv | float | |
| standard_volume_ml | float | Typical serving size |
| source | text | openfoodfacts, usda, thecocktaildb, manual |
| image_url | text | nullable |

### friendships
| Column | Type | Notes |
|--------|------|-------|
| requester_id | uuid | |
| addressee_id | uuid | |
| status | text | pending, accepted, blocked |
| created_at | timestamptz | |

### parties
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | |
| host_id | uuid | |
| invite_code | text | 6-char alphanumeric |
| invite_link | text | Deep link URL |
| location_name | text | |
| start_time | timestamptz | |
| end_time | timestamptz | nullable — set by night-end detection |
| status | text | upcoming, active, ended |
| member_ids | uuid[] | |

### location_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| user_id | uuid | |
| party_id | uuid | nullable |
| timestamp | timestamptz | |
| lat | float | |
| lng | float | |
| venue_name | text | nullable — resolved via Google Places |
| venue_place_id | text | nullable — Google Places ID |

### achievements
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | e.g., "Party Animal" |
| description | text | |
| emoji | text | |
| criteria | jsonb | Machine-readable unlock condition |

### corrections_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| consumption_log_id | uuid | references consumption_log |
| original_ai_output | jsonb | What GPT-4o said |
| user_correction | jsonb | What user changed |
| created_at | timestamptz | |

### media
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| user_id | uuid | |
| party_id | uuid | nullable |
| type | text | drink_scan, in_app_capture, camera_roll_sync |
| storage_url | text | Supabase Storage path |
| captured_at | timestamptz | |
| metadata | jsonb | EXIF data, dimensions, etc. |

### recaps
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| party_id | uuid | |
| generated_at | timestamptz | |
| slides | jsonb | Array of recap slide data |
| media_ids | uuid[] | References media table |

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| User/Profile | core domain | id, name, avatar, biometrics, xp, level, streaks, achievements | has many ConsumptionLogs, Friendships, LocationLogs, Media |
| ConsumptionLog | core domain | drink_type, alcohol_grams, abv, volume, vessel, fill, image, corrections | belongs to User, optionally to Party |
| DrinkCatalog | supporting | name, brand, category, abv, volume, source | referenced by ConsumptionLog |
| Party | core domain | name, host, members, invite_code, location, start/end, status | has many Users, ConsumptionLogs, LocationLogs, Recap |
| Friendship | core domain | requester, addressee, status | connects two Users |
| LocationLog | supporting | coords, timestamp, venue_name, venue_place_id | belongs to User and Party |
| VenueMatch | external system | Google Places ID, name, lat/lng | resolved from LocationLog via Google Places API |
| AIAnalysis | supporting | raw GPT-4o response, identified drink, vessel, fill | produced per drink scan |
| CorrectionLog | supporting | original AI output, user correction | linked to ConsumptionLog |
| Media | supporting | storage_url, type (scan/capture/sync), captured_at | belongs to User and Party |
| Recap | core domain | party_id, slides, media_ids | belongs to Party, references Media |
| Achievement | supporting | name, description, emoji, criteria | earned by Users |
| InviteLink | supporting | deep link URL, invite code, party_id | belongs to Party |
| BACCalculation | derived | current BAC value, decay rate | computed from ConsumptionLog + User biometrics |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 10 | 10 | - | - | - |
| 2 | 10 | 0 | 0 | 10 | 100% |
| 3 | 12 | 2 | 0 | 10 | 83% |
| 4 | 11 | 0 | 0 | 11 | 100% |
| 5 | 12 | 1 | 0 | 11 | 92% |
| 6 | 12 | 0 | 0 | 12 | 100% |
| 7 | 13 | 1 | 0 | 12 | 92% |
| 8 | 14 | 1 | 0 | 13 | 93% |
| 9 | 14 | 0 | 0 | 14 | 100% |

## Interview Transcript
<details>
<summary>Full Q&A (9 rounds)</summary>

### Round 1
**Q:** Your spec says 'Frontend: Already defined/built (iOS/Android mobile interface)' but the existing App_Party is a React web app. Which is the actual target?
**A:** Keep it as is, build it for a mobile app though. We are building out the backend for all the features essentially.
**Ambiguity:** 50% (Goal: 0.70, Constraints: 0.50, Criteria: 0.20, Context: 0.55)

### Round 2
**Q:** If I handed you a working Supabase backend, what would you test first to say 'done'?
**A:** All of it. We can implement in waves but by the end each feature should be fully functional with a full user flow + database.
**Ambiguity:** 41% (Goal: 0.75, Constraints: 0.50, Criteria: 0.45, Context: 0.60)

### Round 3
**Q:** Which AI provider for drink scanning? Do you have an ABV database?
**A:** Look up Cal AI's approach. Base it off companies already doing this, tweak it to be slightly better for us.
**Research:** Cal AI uses GPT-4o Vision. Pipeline: photo → LLM → database lookup (OpenFoodFacts/USDA). Vessel recognition + fill estimation via depth/volume analysis.
**Ambiguity:** 35% (Goal: 0.80, Constraints: 0.65, Criteria: 0.45, Context: 0.60)

### Round 4 (Contrarian Mode)
**Q:** Your paywall puts your two core differentiators (scanning + BAC) behind payment. What if that kills adoption?
**A:** Rethink later. Don't build payment logic yet. Focus on features first, monetize after PMF.
**Ambiguity:** 33% (Goal: 0.80, Constraints: 0.70, Criteria: 0.50, Context: 0.60)

### Round 5
**Q:** What happens when AI is wrong and user corrects?
**A:** A popup shows AI results (drink type, alcohol %, container, fill level). User can edit super easily or confirm. We note corrections they made.
**Ambiguity:** 28% (Goal: 0.85, Constraints: 0.70, Criteria: 0.60, Context: 0.65)

### Round 6 (Simplifier Mode)
**Q:** What's the simplest version you could ship? Pick 3 features.
**A:** Everything in the spec. No cuts.
**Ambiguity:** 26% (Goal: 0.85, Constraints: 0.70, Criteria: 0.65, Context: 0.70)

### Round 7
**Q:** How granular is the location heatmap? How do you detect night ending?
**A:** Venue level. Night ends when person arrives home, stops moving, or phone is inactive. Stops for all when everyone has stopped partying. Then recap is compiled and sent out.
**Ambiguity:** 20% (Goal: 0.90, Constraints: 0.80, Criteria: 0.70, Context: 0.75)

### Round 8
**Q:** What happens when someone taps an invite link?
**A:** Sign up + join in one frictionless flow. Also recommended to get the app.
**Ambiguity:** 18% (Goal: 0.90, Constraints: 0.82, Criteria: 0.75, Context: 0.78)

### Round 9
**Q:** Where do recap photos/videos come from?
**A:** All sources combined: drink scan photos + camera roll sync + in-app capture button.
**Ambiguity:** 14% (Goal: 0.92, Constraints: 0.85, Criteria: 0.82, Context: 0.80)

</details>
