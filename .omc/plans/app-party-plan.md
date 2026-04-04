# App_Party Implementation Plan

**Date:** 2026-04-03
**Type:** Greenfield React + Tailwind CSS web app
**Complexity:** HIGH
**Estimated Files:** ~80-90 files across 6 feature domains

---

## RALPLAN-DR Summary

### Principles (5)

1. **Drunk-Friendly First** — Every UI decision prioritizes impaired usability: oversized tap targets (60pt+), minimal navigation depth (3 taps max), high contrast text (18px+ base).
2. **iOS Fidelity** — The app must feel native-iOS: bottom tab bar with backdrop blur, sheet modals with drag handles, Inter typography with system-ui fallback, safe area insets, spring animations.
3. **Mock-Complete** — All data is in-memory but realistic. The app must feel like a shipped product with populated states, not a prototype with placeholder text.
4. **Feature Parity** — All 6 features carry equal weight. No feature should feel like an afterthought compared to Drink Tracking.
5. **Immutable State** — All state updates create new objects. No mutation of existing data structures.

### Decision Drivers (Top 3)

1. **Speed to polished demo** — This is a frontend-only app with mocked data. The architecture must optimize for rapid visual polish, not backend scalability.
2. **Component reuse across features** — 6 equally-weighted features share common UI patterns (cards, modals, avatars, progress bars). A shared design system prevents inconsistency.
3. **Engagement credibility** — Streaks, XP, badges, and leaderboards must feel like real gamification, not bolted-on counters. The mock data and animations must sell the illusion.

### Viable Options

#### Option A: Vite + React SPA with Zustand (RECOMMENDED)

| Pros | Cons |
|------|------|
| Fastest dev setup, instant HMR | No SSR (not needed for this use case) |
| Zustand is minimal, immutable-friendly | Less structure than Redux for large teams |
| Tailwind v4 works seamlessly with Vite | N/A |
| No routing complexity for a 5-tab app | N/A |

#### Option B: Next.js App Router with Server Components

| Pros | Cons |
|------|------|
| RSC for data fetching patterns | Overkill — no backend, no real data fetching |
| Built-in routing | Adds complexity for a single-page tab-based app |
| Image optimization | All images are mock/placeholder anyway |

#### Option C: Remix with Loaders

| Pros | Cons |
|------|------|
| Great data loading patterns | No backend to load from — loaders are pointless |
| Progressive enhancement | Target is specifically iPhone web — no PE needed |

### Recommendation

**Option A: Vite + React SPA with Zustand.** This is a frontend-only demo app with mocked data. Next.js and Remix add routing and data-fetching infrastructure that provide zero value here. Vite gives the fastest development loop, Zustand provides clean immutable state management, and React Router handles the minimal routing needs (5 tabs + detail views).

### ADR

- **Decision:** Vite + React + Tailwind CSS + Zustand + React Router v7 (client-side only) + Framer Motion + Vitest + React Testing Library
- **Drivers:** Speed to polish, zero backend requirements, iOS animation fidelity, 80% test coverage requirement
- **Alternatives Considered:** Next.js (overkill), Remix (pointless loaders), Redux (too heavy for mock state), Jest (slower than Vitest for Vite projects)
- **Why Chosen:** Minimal tooling overhead, maximum focus on UI polish and mock data quality. Vitest shares Vite config so zero extra configuration overhead.
- **Consequences:** No SSR, no SEO (not needed). All state is ephemeral (intended). Phases 3-5 are sequential (not parallel) because a single agent cannot safely share evolving interfaces across branches.
- **Follow-ups:** If this ever needs a real backend, migrate to Next.js at that point.
- **Store consolidation (ADR-002):** 5 original stores collapsed to 3: `useAppStore` (user + notifications), `useDrinkStore` (drinks + leaderboard derived), `usePartyStore` (party + social feed). Decided at Phase 2 to prevent interface drift across phases.
- **Routing (ADR-003):** React Router v7 in basic client-side mode only. No data routers, no framework mode, no loaders/actions. Simple `<Routes>/<Route>` with `createBrowserRouter` for tab routing.
- **Font (ADR-004):** Inter via Google Fonts as primary, `system-ui` as fallback. SF Pro is an Apple proprietary font and must not be referenced or bundled.

---

## Data Model

All entities live in `src/types/`. This is the single source of truth referenced by all features, stores, and mock data. No `any` types permitted anywhere.

### Entity Interfaces

```typescript
// src/types/user.ts
export interface User {
  id: string;
  name: string;
  avatarUrl: string;       // DiceBear or UI Faces URL
  xp: number;
  level: number;           // derived: xpToLevel(xp)
  streakWeekends: number;  // consecutive weekends with activity
  badges: Badge[];
  weightKg: number;        // used for BAC calculation
  biologicalSex: 'male' | 'female'; // used for BAC Widmark constant
}

// src/types/drink.ts
export interface DrinkCatalogItem {
  id: string;
  name: string;
  emoji: string;
  abv: number;             // e.g. 0.05 for 5%
  volumeMl: number;        // serving size in ml
  standardDrinks: number;  // pre-computed: (abv * volumeMl * 0.789) / 14
  category: 'beer' | 'cocktail' | 'shot' | 'wine' | 'other';
}

export interface DrinkLogEntry {
  id: string;
  catalogItemId: string;
  loggedAt: string;        // ISO 8601 timestamp
  userId: string;
}

// src/types/party.ts
export interface Party {
  id: string;
  name: string;
  hostId: string;          // references User.id
  memberIds: string[];     // references User.id[]
  inviteCode: string;      // 6-char alphanumeric e.g. "X7KM2P"
  locationName: string;
  startTime: string;       // ISO 8601
  status: 'upcoming' | 'active' | 'ended';
}

export interface Invite {
  code: string;
  partyId: string;
  expiresAt: string;       // ISO 8601
}

// src/types/leaderboard.ts
export interface LeaderboardEntry {
  userId: string;
  rank: number;
  drinkCount: number;
  xp: number;
  period: 'tonight' | 'weekend' | 'alltime';
}

// src/types/recap.ts
export interface RecapSlide {
  id: string;
  variant: 'stat-reveal' | 'group-photo' | 'drink-breakdown' | 'peak-moment';
  heading: string;
  subheading: string;
  value?: string;          // e.g. "7 drinks" or "11:42 PM"
  backgroundGradient: string; // Tailwind gradient class
}

export interface Recap {
  id: string;
  partyId: string;
  date: string;            // ISO 8601
  slides: RecapSlide[];
}

// src/types/safety.ts
export type SafetyLevel = 'safe' | 'warning' | 'danger';

export interface SafetyAlert {
  id: string;
  level: SafetyLevel;      // warning = BAC >= 0.06, danger = BAC >= 0.08
  message: string;
  triggeredAt: string;     // ISO 8601
  acknowledged: boolean;
}

// src/types/social.ts
export interface SocialPost {
  id: string;
  userId: string;
  imageUrl: string;        // placeholder image URL
  caption: string;
  likeCount: number;
  commentCount: number;
  postedAt: string;        // ISO 8601
  partyId?: string;
}

// src/types/engagement.ts
export interface Badge {
  id: string;
  name: string;            // e.g. "Party Animal"
  description: string;
  emoji: string;
  unlockedAt?: string;     // ISO 8601, undefined if not yet earned
}

export interface Streak {
  weekendsActive: number;
  currentMultiplier: number; // e.g. 1.5x for 3+ weekends
  lastActiveWeekend: string; // ISO 8601 date of last Saturday
}
```

### Relationships

```
User ──(owns many)──> DrinkLogEntry
User ──(earns many)──> Badge
User ──(has one)────> Streak
Party ──(has many)──> User (via memberIds)
Party ──(has one)───> Invite
Party ──(has many)──> DrinkLogEntry (via userId membership)
Party ──(produces one)──> Recap
Recap ──(has many)──> RecapSlide
DrinkLogEntry ──(references one)──> DrinkCatalogItem
LeaderboardEntry ──(references one)──> User
SafetyAlert ──(triggered by)──> DrinkLogEntry (BAC threshold)
SocialPost ──(authored by)──> User
SocialPost ──(may belong to)──> Party
```

---

## Store Architecture (3 consolidated stores)

Consolidated from 5 to 3 to prevent interface drift. Store interfaces are exported as TypeScript types in `src/types/stores.ts` and must not be changed without updating all consumers.

```typescript
// src/types/stores.ts — source of truth for all store shapes

export interface AppStoreState {
  currentUser: User;
  notifications: SafetyAlert[];
  toasts: Toast[];
  // actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  addSafetyAlert: (alert: Omit<SafetyAlert, 'id' | 'triggeredAt'>) => void;
  acknowledgeSafetyAlert: (id: string) => void;
  awardXP: (amount: number) => void;
}

export interface DrinkStoreState {
  catalog: DrinkCatalogItem[];
  log: DrinkLogEntry[];
  leaderboard: LeaderboardEntry[];  // derived from mock-users + log
  leaderboardPeriod: 'tonight' | 'weekend' | 'alltime';
  // actions
  addDrink: (catalogItemId: string) => void;
  removeDrink: (entryId: string) => void;
  setLeaderboardPeriod: (period: DrinkStoreState['leaderboardPeriod']) => void;
}

export interface PartyStoreState {
  activeParty: Party | null;
  pastParties: Party[];
  socialFeed: SocialPost[];
  recaps: Recap[];
  // actions
  createParty: (name: string, location: string, memberIds: string[]) => void;
  joinParty: (inviteCode: string) => void;
  leaveParty: () => void;
}

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}
```

---

## Project Structure

```
App_Party/
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts                  # Vitest configuration (separate from vite for clarity)
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                          # Entry point, providers
│   ├── App.tsx                           # Router + layout shell
│   ├── index.css                         # Tailwind directives + Inter font import + custom CSS
│   │
│   ├── types/                            # SINGLE SOURCE OF TRUTH for all entity interfaces
│   │   ├── user.ts                       # User, Streak
│   │   ├── drink.ts                      # DrinkCatalogItem, DrinkLogEntry
│   │   ├── party.ts                      # Party, Invite
│   │   ├── leaderboard.ts                # LeaderboardEntry
│   │   ├── recap.ts                      # Recap, RecapSlide
│   │   ├── safety.ts                     # SafetyAlert, SafetyLevel
│   │   ├── social.ts                     # SocialPost
│   │   ├── engagement.ts                 # Badge
│   │   └── stores.ts                     # AppStoreState, DrinkStoreState, PartyStoreState, Toast
│   │
│   ├── design-system/                    # Shared UI primitives
│   │   ├── theme.ts                      # Color tokens, spacing, typography
│   │   ├── components/
│   │   │   ├── Button.tsx                # Primary/secondary/ghost variants, 60pt min
│   │   │   ├── Card.tsx                  # Surface-raised cards with glow borders
│   │   │   ├── Avatar.tsx                # User avatars with status rings
│   │   │   ├── Badge.tsx                 # Achievement/notification badges
│   │   │   ├── ProgressBar.tsx           # XP bars, BAC meters
│   │   │   ├── SheetModal.tsx            # iOS-style bottom sheet with drag
│   │   │   ├── TabBar.tsx                # Bottom tab bar with blur + safe area
│   │   │   ├── TopBar.tsx                # Status bar area + page title + safety icon
│   │   │   ├── EmptyState.tsx            # Illustrated empty states
│   │   │   ├── Toast.tsx                 # Notification toasts
│   │   │   └── SegmentedControl.tsx      # iOS-style segmented toggle
│   │   └── animations.ts                 # Framer Motion variants (spring, slide, fade)
│   │
│   ├── data/                             # Mock data layer
│   │   ├── mock-users.ts                 # 8-10 realistic user profiles
│   │   ├── mock-drinks.ts                # Drink catalog (beers, cocktails, shots)
│   │   ├── mock-parties.ts               # Party events with invite codes
│   │   ├── mock-achievements.ts          # Badges, streaks, XP tables
│   │   └── mock-recaps.ts               # Night recap story data
│   │
│   ├── store/                            # Zustand stores (immutable) — 3 stores
│   │   ├── app-store.ts                  # useAppStore: user + notifications + toasts
│   │   ├── drink-store.ts                # useDrinkStore: drink log + leaderboard derived
│   │   └── party-store.ts                # usePartyStore: active party + social feed + recaps
│   │
│   ├── features/                         # Feature modules (one per tab + extras)
│   │   ├── drinks/                       # HERO FEATURE: Drink Tracking
│   │   │   ├── DrinksTab.tsx
│   │   │   ├── DrinkLogger.tsx
│   │   │   ├── DrinkCard.tsx
│   │   │   ├── PhotoRecognition.tsx
│   │   │   ├── BACMeter.tsx
│   │   │   └── DrinkCatalog.tsx
│   │   │
│   │   ├── safety/                       # Safety Alerts (co-located with drinks, BAC-coupled)
│   │   │   ├── SafetyMonitor.tsx
│   │   │   ├── SafetyAlert.tsx
│   │   │   ├── SafetyDashboard.tsx
│   │   │   └── EmergencyContacts.tsx
│   │   │
│   │   ├── leaderboard/                  # Leaderboard
│   │   │   ├── LeaderboardTab.tsx
│   │   │   ├── LeaderboardRow.tsx
│   │   │   ├── LeaderboardFilters.tsx
│   │   │   └── FriendComparison.tsx
│   │   │
│   │   ├── party/                        # Party & Social
│   │   │   ├── PartyTab.tsx
│   │   │   ├── CreateParty.tsx
│   │   │   ├── PartyLobby.tsx
│   │   │   ├── InviteCode.tsx
│   │   │   └── PartyMember.tsx
│   │   │
│   │   ├── recap/                        # Night Recap (Spotify Wrapped style)
│   │   │   ├── RecapTab.tsx
│   │   │   ├── RecapStory.tsx
│   │   │   ├── RecapSlide.tsx
│   │   │   ├── RecapStats.tsx
│   │   │   └── RecapShare.tsx
│   │   │
│   │   └── social/                       # Social Media Integration
│   │       ├── SocialTab.tsx
│   │       ├── SocialPost.tsx
│   │       ├── ShareSheet.tsx
│   │       └── SocialFeed.tsx
│   │
│   ├── engagement/                       # Cross-cutting engagement systems
│   │   ├── XPSystem.tsx
│   │   ├── StreakTracker.tsx
│   │   ├── AchievementUnlock.tsx
│   │   └── ProfileStats.tsx
│   │
│   ├── hooks/                            # Custom hooks
│   │   ├── use-haptic.ts
│   │   ├── use-safe-area.ts
│   │   └── use-timer.ts
│   │
│   └── utils/                            # Pure utility functions
│       ├── bac-calculator.ts
│       ├── xp-calculator.ts
│       ├── format.ts
│       └── invite-code.ts
│
└── src/__tests__/                        # Test files mirror src/ structure
    ├── utils/
    │   ├── bac-calculator.test.ts
    │   ├── xp-calculator.test.ts
    │   ├── format.test.ts
    │   └── invite-code.test.ts
    ├── store/
    │   ├── app-store.test.ts
    │   ├── drink-store.test.ts
    │   └── party-store.test.ts
    └── features/
        ├── drinks/
        │   ├── BACMeter.test.tsx
        │   └── DrinkLogger.test.tsx
        ├── safety/
        │   └── SafetyMonitor.test.ts
        └── leaderboard/
            └── LeaderboardTab.test.tsx
```

---

## Implementation Phases

Phases 1-6 are **strictly sequential**. There is no parallelization. Each phase must be complete and verified before the next begins. This eliminates interface drift between concurrent branches.

---

### Phase 1: Foundation (Design System + Scaffolding + Test Setup)

**Goal:** Working app shell with tab navigation, theme, all shared components, and a fully configured test suite. Opening the app shows a polished empty state. The test runner passes on an empty test suite.

**Files to create:**

| File | Purpose | Key Details |
|------|---------|-------------|
| `package.json` | Dependencies | react, react-dom, react-router-dom@7, zustand, framer-motion, tailwindcss v4, vite, typescript, vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, lucide-react |
| `vite.config.ts` | Vite configuration | React plugin, path aliases (`@/` -> `src/`) |
| `vitest.config.ts` | Vitest configuration | jsdom environment, setupFiles pointing to test-setup.ts, coverage provider v8, coverage thresholds: branches 80, functions 80, lines 80, statements 80 |
| `src/test-setup.ts` | Test setup | Import @testing-library/jest-dom to extend expect matchers |
| `tsconfig.json` | TypeScript config | Strict mode, path aliases |
| `tailwind.config.ts` | Tailwind config | Custom colors (surface/accent/glow), font sizes (18px base), extended spacing for 60pt targets |
| `postcss.config.js` | PostCSS | Tailwind + autoprefixer |
| `index.html` | HTML shell | Viewport meta for iOS, theme-color meta, apple-mobile-web-app-capable, Inter font preload via Google Fonts |
| `src/index.css` | Global styles | Tailwind directives, Inter font-family with system-ui fallback, dark body background, safe-area-inset CSS vars |
| `src/main.tsx` | App entry | StrictMode, RouterProvider |
| `src/App.tsx` | Layout shell | Bottom TabBar, Outlet for active tab, safe area padding |
| `src/design-system/theme.ts` | Design tokens | All color values, spacing scale, typography scale, border radii as constants |
| `src/design-system/animations.ts` | Motion presets | Spring configs, slide-up for sheets, fade-in, scale-pop for badges |
| `src/design-system/components/Button.tsx` | Button | Variants: primary (accent), secondary (surface-raised), ghost. Min height 60px, min width 60px. Haptic on press. |
| `src/design-system/components/Card.tsx` | Card | Surface-raised bg, rounded-2xl, optional glow border (cyan), padding responsive |
| `src/design-system/components/Avatar.tsx` | Avatar | Circular image with colored ring (online/offline/drinking), sizes: sm/md/lg |
| `src/design-system/components/Badge.tsx` | Badge | Pill badges for counts, icon badges for achievements. Accent and glow variants. |
| `src/design-system/components/ProgressBar.tsx` | Progress | Animated fill with gradient (accent->glow), percentage label, sizes |
| `src/design-system/components/SheetModal.tsx` | Bottom sheet | Framer Motion drag-to-dismiss, backdrop blur, drag handle bar, snap points |
| `src/design-system/components/TabBar.tsx` | Tab navigation | 5 tabs with icons, backdrop-blur-xl bg, safe-area-bottom padding, active indicator with glow |
| `src/design-system/components/TopBar.tsx` | Top bar | Page title (bold, large), optional right action button, safe-area-top padding, persistent safety icon (shield) that opens SafetyDashboard when BAC > 0 |
| `src/design-system/components/EmptyState.tsx` | Empty state | Centered icon + title + subtitle + optional CTA button |
| `src/design-system/components/Toast.tsx` | Toast | Slide-down toast with auto-dismiss, success/warning/error/info variants |
| `src/design-system/components/SegmentedControl.tsx` | Segmented | iOS-style pill toggle with sliding indicator, 2-4 segments |

**Acceptance Criteria:**
- [ ] `npm run dev` starts without errors
- [ ] `npm run test` runs and exits (0 tests pass is acceptable at this stage)
- [ ] `npm run coverage` produces a coverage report
- [ ] App displays a bottom tab bar with 5 tabs (Drinks, Leaderboard, Party, Recap, Profile). Social feed is accessed within the Party tab.
- [ ] Tapping tabs switches views (showing empty states)
- [ ] Tab bar has backdrop blur effect on dark background
- [ ] All design tokens match the specified color palette exactly
- [ ] Base font size is 18px, all tap targets are minimum 60px
- [ ] Font family is Inter with system-ui fallback (not SF Pro)
- [ ] Safe area insets are respected (content not behind notch/home indicator)
- [ ] SheetModal can be opened and dragged to dismiss
- [ ] TopBar renders a shield safety icon that is always visible

---

### Phase 2: Types + Mock Data Layer + State Management

**Goal:** All entity types defined. Realistic mock data populated across all stores. The app has "content" even though nothing is real. This phase establishes the interfaces that all subsequent phases depend on — no interface changes permitted after this phase without updating all consumers.

**Files to create:**

| File | Purpose | Key Details |
|------|---------|-------------|
| `src/types/user.ts` | User entity | User, Streak interfaces as defined in Data Model section |
| `src/types/drink.ts` | Drink entities | DrinkCatalogItem, DrinkLogEntry interfaces |
| `src/types/party.ts` | Party entities | Party, Invite interfaces |
| `src/types/leaderboard.ts` | Leaderboard entity | LeaderboardEntry interface |
| `src/types/recap.ts` | Recap entities | Recap, RecapSlide interfaces |
| `src/types/safety.ts` | Safety entities | SafetyAlert, SafetyLevel interfaces |
| `src/types/social.ts` | Social entity | SocialPost interface |
| `src/types/engagement.ts` | Engagement entities | Badge interface |
| `src/types/stores.ts` | Store contracts | AppStoreState, DrinkStoreState, PartyStoreState, Toast interfaces |
| `src/data/mock-users.ts` | User profiles | 8-10 users with names, DiceBear avatar URLs, XP levels, streak counts, badges earned, weight/sex for BAC |
| `src/data/mock-drinks.ts` | Drink catalog | 20+ drinks across 4 categories with 5+ items each: beers (IPA, lager, stout, pale ale, sour), cocktails (margarita, old fashioned, negroni, mojito, aperol spritz), shots (tequila, whiskey, vodka, jager, sake), wine (red, white, rose, prosecco, champagne). Each has name, emoji, ABV, volumeMl, standardDrinks, category |
| `src/data/mock-parties.ts` | Party data | 3 parties: one active (tonight), one past (last weekend), one upcoming. Each has host, members, invite code, location name, start time |
| `src/data/mock-achievements.ts` | Achievement system | 15+ badges (First Drink, Party Animal, Hydration Hero, Weekend Warrior, Safety First, Social Butterfly, etc.), XP table (level 1-20, exponential curve), streak milestones |
| `src/data/mock-recaps.ts` | Recap stories | 2 complete night recaps with slides: total drinks, peak hour, most popular drink, group photo moment, distance walked, money spent |
| `src/store/app-store.ts` | useAppStore | Current user, XP/level, notifications, toasts. Immutable Zustand set. awardXP creates new user object (spread). |
| `src/store/drink-store.ts` | useDrinkStore | Tonight's drink log, running BAC estimate, drink catalog, leaderboard derived from mock-users + log, leaderboard period filter. addDrink/removeDrink create new log arrays. |
| `src/store/party-store.ts` | usePartyStore | Active party, past parties, social feed, recaps. createParty/joinParty/leaveParty create new party objects. |
| `src/utils/bac-calculator.ts` | BAC math | Widmark formula: BAC = (standardDrinks * 14 / (weightKg * genderConstant * 10)) - (0.015 * hoursElapsed). genderConstant: male=0.68, female=0.55. Pure function. |
| `src/utils/xp-calculator.ts` | XP math | XP per drink logged (10 base), bonus XP for streaks (10% per weekend), level thresholds (exponential: level * level * 100). Pure functions. |
| `src/utils/format.ts` | Formatters | `formatBAC(0.08) -> "0.08"`, `formatTime(date) -> "11:42 PM"`, `formatXP(1500) -> "1.5K"`, `formatDrinkCount(n) -> "7 drinks"` |
| `src/utils/invite-code.ts` | Code generator | 6-char alphanumeric codes (uppercase only), `generateInviteCode() -> "X7KM2P"` |
| `src/hooks/use-haptic.ts` | Haptic hook | Wraps navigator.vibrate with fallback no-op. Light/medium/heavy patterns. |
| `src/hooks/use-safe-area.ts` | Safe area hook | Reads CSS env(safe-area-inset-*) values, returns {top, bottom, left, right} |
| `src/hooks/use-timer.ts` | Timer hook | setInterval wrapper with cleanup, used for BAC decay and safety checks |

**Tests to write FIRST (TDD — write before implementation):**

| Test File | What to Test |
|-----------|-------------|
| `src/__tests__/utils/bac-calculator.test.ts` | Known BAC values for fixed inputs (0 drinks = 0.00, 3 standard drinks / 70kg male / 1hr = ~0.048), edge cases (0 weight, negative hours clamp to 0) |
| `src/__tests__/utils/xp-calculator.test.ts` | Level thresholds are monotonically increasing, level 1 threshold < level 2, XP per drink > 0, streak bonus is additive |
| `src/__tests__/utils/format.test.ts` | formatBAC(0.082) -> "0.08" (2dp), formatXP(0) -> "0", formatXP(1500) -> "1.5K", formatXP(1000000) -> "1M" |
| `src/__tests__/utils/invite-code.test.ts` | Output is exactly 6 chars, only uppercase alphanumeric, two calls produce different results (probabilistic) |
| `src/__tests__/store/drink-store.test.ts` | addDrink creates new array (original unchanged), removeDrink removes correct entry, BAC updates after addDrink, leaderboard is sorted descending by drinkCount |
| `src/__tests__/store/app-store.test.ts` | awardXP creates new user object (referential inequality), addToast adds entry, dismissToast removes by id |

**Acceptance Criteria:**
- [ ] All type files compile with zero TypeScript errors
- [ ] All mock data files export typed arrays/objects (no `any` types)
- [ ] Zustand stores use immutable update patterns (spread, not mutation)
- [ ] All utility tests written and passing before utility implementations exist (TDD red -> green)
- [ ] `bac-calculator` returns correct values for known test cases
- [ ] `xp-calculator` level thresholds are monotonically increasing
- [ ] All stores can be read from any component via hooks
- [ ] Mock users have diverse, realistic profiles (not "User 1, User 2")
- [ ] Drink catalog covers at least 4 categories with 5+ items each
- [ ] Loading state: stores expose an `isHydrated` boolean (true after initial mock data load)
- [ ] Empty state: `drink-store` log starts empty (user has not logged tonight yet — empty state shown)
- [ ] Error state: store actions that receive invalid IDs return without mutating state

---

### Phase 3: Drinks (Hero Feature) + Safety Alerts

**Goal:** The Drinks tab is fully functional with quick-add flow, BAC meter, drink log, and simulated photo recognition. Safety alerts are implemented simultaneously because they are tightly coupled to BAC calculation — both read the same BAC value from `useDrinkStore`.

**Tests to write FIRST (TDD):**

| Test File | What to Test |
|-----------|-------------|
| `src/__tests__/features/drinks/DrinkLogger.test.tsx` | Renders category selection step, selecting a category advances to drink selection, selecting a drink calls addDrink and closes modal |
| `src/__tests__/features/drinks/BACMeter.test.tsx` | Renders 0.00 when log is empty, shows correct color class at green/yellow/red thresholds, aria-label announces BAC value |
| `src/__tests__/features/safety/SafetyMonitor.test.ts` | No alert when BAC < 0.06, warning alert triggered at BAC >= 0.06, danger alert triggered at BAC >= 0.08, duplicate alert not added if same level already active |

**Files to create:**

| File | Purpose | Key Details |
|------|---------|-------------|
| `src/features/drinks/DrinksTab.tsx` | Main view | Top: animated BAC meter. Middle: tonight's drink log (scrollable, empty state when no drinks). Bottom: large "Add Drink" FAB button (accent, 72px). Loading state: skeleton cards while store hydrates. |
| `src/features/drinks/DrinkLogger.tsx` | Add drink flow | Sheet modal. Step 1: Pick category (Beer/Cocktail/Shot/Wine — large tiles, 80px+). Step 2: Pick specific drink. Step 3: Confirm (shows drink + BAC impact preview). Max 3 taps. |
| `src/features/drinks/DrinkCard.tsx` | Drink entry | Card showing: drink emoji, name, time logged, standard drinks value. Swipe-to-delete with haptic. Empty state: not applicable (only renders inside a list). |
| `src/features/drinks/PhotoRecognition.tsx` | Photo mock | "Scan Your Drink" button opens a simulated camera view. After 2s "scanning" animation, identifies a random drink from catalog. Glow border animation on recognition. Error state: "Could not identify drink — add manually" fallback button. |
| `src/features/drinks/BACMeter.tsx` | BAC gauge | Circular gauge with gradient fill (green->yellow->red). Animated number in center. Glow effect at current level. Updates in real-time as drinks are added. aria-label for accessibility. |
| `src/features/drinks/DrinkCatalog.tsx` | Browse drinks | Full catalog in a sheet modal. Search bar (filters by name), category filters (SegmentedControl), grid of drink cards. Tap to quick-add. Empty state: "No drinks match your search." |
| `src/features/safety/SafetyMonitor.tsx` | Background logic | Monitors BAC from useDrinkStore every 30s via useTimer. Triggers warning alert at BAC >= 0.06, danger alert at BAC >= 0.08. No duplicate alerts for same level. Not a visible component — logic only. Mounted in App.tsx. |
| `src/features/safety/SafetyAlert.tsx` | Alert overlay | Full-screen warning with large text and icon. Warning level: "Slow down — you're drinking fast" (amber). Danger level: "Time to stop" (red). Large acknowledge button (72px+). Acknowledging calls acknowledgeSafetyAlert. |
| `src/features/safety/SafetyDashboard.tsx` | Safety view | Accessible via shield icon in TopBar. Shows: current BAC trend (line chart), hydration reminder with countdown, time since last drink, current drinking pace (drinks/hour). Loading state: skeleton. Empty state: "Log drinks to see your safety stats." |
| `src/features/safety/EmergencyContacts.tsx` | Emergency | 3 pre-populated mock contacts with large "Call" buttons (72px+). Uber/Lyft mock buttons for ride home. Error state: not applicable (all mock data). |

**Acceptance Criteria:**
- [ ] All Phase 3 tests written before implementation (TDD)
- [ ] Adding a drink takes exactly 3 taps (FAB -> category -> specific drink)
- [ ] BAC meter animates smoothly when drinks are added
- [ ] BAC meter color: green (BAC 0–0.059), yellow (0.06–0.079), red (0.08+)
- [ ] Photo recognition shows a convincing scanning animation before "identifying" a drink
- [ ] Drink log shows all drinks for tonight in reverse chronological order
- [ ] Drink log shows empty state when no drinks logged ("Tap + to log your first drink")
- [ ] Drinks can be removed via swipe gesture
- [ ] All tap targets are 60px+ minimum (FAB is 72px)
- [ ] XP is awarded when logging a drink (toast notification shows "+10 XP")
- [ ] Safety: no alert fires below BAC 0.06
- [ ] Safety: warning alert fires at BAC >= 0.06 (amber, full-screen)
- [ ] Safety: danger alert fires at BAC >= 0.08 (red, full-screen)
- [ ] Safety: shield icon in TopBar is always visible when BAC > 0
- [ ] Safety: tapping shield icon opens SafetyDashboard
- [ ] Safety: SafetyDashboard shows empty state when no drinks logged

---

### Phase 4: Leaderboard + Party

**Goal:** Competitive and social features are live. Users can see rankings and party together.

**Tests to write FIRST (TDD):**

| Test File | What to Test |
|-----------|-------------|
| `src/__tests__/features/leaderboard/LeaderboardTab.test.tsx` | Renders ranked list sorted by drinkCount descending, current user row has distinct visual class, switching period filter updates displayed data, top 3 have podium variant |

**Files to create:**

| File | Purpose | Key Details |
|------|---------|-------------|
| `src/features/leaderboard/LeaderboardTab.tsx` | Main view | SegmentedControl: Tonight / This Weekend / All Time. Top 3 users get podium display (1st centered, elevated). Rest in scrollable list. Loading state: skeleton rows. Empty state (no data): "Be the first to log a drink!" |
| `src/features/leaderboard/LeaderboardRow.tsx` | User row | Rank number, avatar, name, drink count, XP. Animated entry (stagger on mount). Current user highlighted with glow border. |
| `src/features/leaderboard/LeaderboardFilters.tsx` | Filters | Time period toggle (SegmentedControl) + drink type filter (All/Beer/Cocktails/Shots). Changing filter reads from useDrinkStore.leaderboard filtered by period. |
| `src/features/leaderboard/FriendComparison.tsx` | H2H comparison | Sheet modal: side-by-side stats comparison with animated bar charts. "You vs. [Friend]" header. Empty state: not applicable (opened from a user row). |
| `src/features/party/PartyTab.tsx` | Main view | If in party: show PartyLobby. If not: show two large cards — "Create Party" and "Join Party". Empty state = no active party, which shows the create/join cards. |
| `src/features/party/CreateParty.tsx` | Create flow | Party name input, location (text), invite friends (checkboxes from mock users). Generates invite code on create via generateInviteCode(). Error state: name cannot be empty (inline validation message). |
| `src/features/party/PartyLobby.tsx` | Active party | Party name header, member grid with live drink counts, shared BAC leaderboard, party duration timer. Loading state: skeleton member cards. |
| `src/features/party/InviteCode.tsx` | Invite display | Large monospaced invite code with "Copy" (copies to clipboard, shows success toast) and "Share" buttons. QR-code styled decorative border. Glow animation. |
| `src/features/party/PartyMember.tsx` | Member card | Avatar, name, drink count badge, current BAC indicator dot (green=safe, yellow=warning, red=danger using same thresholds as safety alerts). |

**Acceptance Criteria:**
- [ ] All Phase 4 tests written before implementation (TDD)
- [ ] Leaderboard shows ranked users with correct ordering (descending drinkCount)
- [ ] Time period filter changes displayed data
- [ ] Current user (you) is visually distinct in the leaderboard (glow border)
- [ ] Tapping a leaderboard row opens friend comparison sheet
- [ ] Leaderboard shows empty state when no data exists
- [ ] Party can be "created" with a generated invite code
- [ ] Party creation shows inline error if name is empty
- [ ] Party lobby shows all mock members with live-ish stats
- [ ] Party member BAC dot uses same color thresholds as BACMeter (0.06/0.08)
- [ ] Invite code is large, readable, and has a copy interaction (success toast confirms)
- [ ] Top 3 leaderboard positions have distinct visual treatment (podium)

---

### Phase 5: Recap + Social Feed + Engagement

**Goal:** Remaining 3 features implemented plus the cross-cutting engagement systems (XP, streaks, badges).

**Tests to write FIRST (TDD):**

| Test File | What to Test |
|-----------|-------------|
| `src/__tests__/features/recap/RecapStory.test.tsx` | Tap right advances to next slide, tap left goes back, progress bar updates, auto-advance fires after 5s |
| `src/__tests__/features/social/SocialPost.test.tsx` | Like button increments count (immutable update — original object unchanged), renders avatar + caption + timestamp |

**Files to create:**

| File | Purpose | Key Details |
|------|---------|-------------|
| `src/features/recap/RecapTab.tsx` | Entry point | Shows past recaps as cards (date, thumbnail, slide count). Tap opens story. Empty state: "Party tonight to unlock your recap!" with illustration. Loading state: skeleton cards. |
| `src/features/recap/RecapStory.tsx` | Story container | Full-screen swipeable story (horizontal swipe). Progress bars at top (Instagram-style). Tap left half / right half to navigate. Auto-advance timer (5s per slide). |
| `src/features/recap/RecapSlide.tsx` | Story slide | Full-screen colored backgrounds with large animated stats. Variants: stat-reveal, group-photo, drink-breakdown, peak-moment. Each variant has a distinct layout. |
| `src/features/recap/RecapStats.tsx` | Stat animation | Count-up number animation (0 to final value over 800ms), bar chart reveal, confetti on final slide. |
| `src/features/recap/RecapShare.tsx` | Share mock | "Share Your Night" button opens ShareSheet with mock social platform options. |
| `src/features/social/SocialTab.tsx` | Feed view | Instagram-style feed of mock social posts. Loading state: skeleton post cards. Empty state: "Follow friends to see their posts here." Pull-to-refresh animation (mock — resets scroll position). |
| `src/features/social/SocialPost.tsx` | Post card | User avatar + name, drink photo (placeholder image), caption, like/comment counts, timestamp. Like button increments count locally (immutable update). |
| `src/features/social/ShareSheet.tsx` | Share action | iOS-style action sheet: Copy Link, Instagram Story, Snapchat, iMessage, More. Mock interactions (show toast on each tap). |
| `src/features/social/SocialFeed.tsx` | Feed logic | Renders list of SocialPost from usePartyStore.socialFeed. Handles loading state (skeletons) and empty state. |
| `src/engagement/XPSystem.tsx` | XP display | XP gain animation (floating "+10 XP" text rises and fades), level progress bar, level-up celebration modal with confetti when XP crosses level threshold. |
| `src/engagement/StreakTracker.tsx` | Streaks | Weekend streak calendar visualization (last 8 weekends). Fire emoji for active weekends. Streak count with multiplier display. |
| `src/engagement/AchievementUnlock.tsx` | Badge unlock | Full-screen celebration: badge icon scales up with glow, confetti particles, "Achievement Unlocked!" text. Auto-dismiss after 3s. |
| `src/engagement/ProfileStats.tsx` | Profile view | 5th tab content. Shows: avatar, level, XP bar, streak, badges grid, lifetime stats (total drinks, parties, nights out). Loading state: skeleton. Empty state: not applicable (always has current user data). |

**Acceptance Criteria:**
- [ ] Recap stories are swipeable horizontally with progress indicators
- [ ] Stat reveals animate (count-up numbers, not instant)
- [ ] RecapTab shows empty state when no past recaps exist
- [ ] Social feed shows empty state when no posts exist
- [ ] Social post like button increments count without reloading feed
- [ ] Share sheet shows mock platform options and confirms action via toast
- [ ] XP gain shows animated floating text on drink log
- [ ] Badge unlock plays a celebration animation
- [ ] Streak tracker shows calendar with fire indicators
- [ ] Profile tab shows comprehensive user stats (no skeleton — data always available)

---

### Phase 6: Polish, Animations, QA, and Coverage Gate

**Goal:** The app feels like a shipped product. Smooth animations, consistent spacing, no visual bugs, responsive to iPhone screen sizes. All measurable exit criteria satisfied before declaring done.

**Tasks (no new files — refinement of existing):**

1. **Animation audit** — Ensure every state change has a transition. Page transitions (slide), list items (stagger), modals (spring), buttons (scale on press). Use Framer Motion `AnimatePresence` for mount/unmount.

2. **Typography audit** — Verify all text meets minimums: body 18px, labels 16px, headings 24px+. No light-weight fonts below 20px (readability in dark/drunk conditions). Confirm Inter is rendering (not system-ui fallback).

3. **Touch target audit** — Every interactive element measured against 60px minimum via DOM inspection (check computed height/width in browser DevTools). Increase padding on any element below threshold.

4. **Color contrast audit** — All text passes WCAG AA against its background. Content (#F0F0F5) on surface (#0A0A0F) = 15.4:1 ratio (passes). Verify content-secondary (#9494A8) usage.

5. **iPhone viewport testing** — Test at 375x812 (iPhone 13 mini), 390x844 (iPhone 14), 430x932 (iPhone 15 Pro Max). No horizontal overflow, no content behind safe areas.

6. **Loading states** — Add skeleton screens for leaderboard, social feed, recap. Shimmer animation on placeholder cards.

7. **Haptic feedback** — Ensure haptic fires on: drink add, badge unlock, tab switch, sheet open/close, swipe actions.

8. **Performance** — Lazy load feature modules via React.lazy + Suspense. Ensure no jank on tab switches.

9. **Coverage gate** — Run `npm run coverage`. All thresholds must pass before declaring the phase complete. Fix any uncovered code paths by adding targeted tests (not by excluding files).

**Measurable Exit Criteria (all must be verified, not assumed):**

- [ ] All tap targets >= 60px verified via DOM inspection (browser DevTools computed styles)
- [ ] All features reachable in <= 3 taps from any tab (manual trace for each feature)
- [ ] Bundle size < 500KB gzipped (verified via `vite build` + `gzip -l dist/assets/*.js`)
- [ ] Animations at 60fps on mobile Safari (verified via Safari Web Inspector > Timelines > Rendering)
- [ ] Lighthouse performance score > 90 (run via Chrome DevTools Lighthouse panel on production build)
- [ ] Test coverage >= 80% on lines, branches, functions, statements (shown in coverage report)
- [ ] Zero TypeScript errors (`npx tsc --noEmit` exits with code 0)
- [ ] Zero console errors during normal usage (open DevTools, navigate all tabs, log a drink, check console)
- [ ] Every page transition is animated (no instant cuts)
- [ ] No text smaller than 16px anywhere in the app
- [ ] App looks correct on iPhone 13 mini through iPhone 15 Pro Max viewports
- [ ] Skeleton loading states appear before content renders
- [ ] No layout shift when content loads

---

## Success Criteria (Overall)

1. A first-time user can open the app, add a drink, and see it on the leaderboard in under 10 seconds
2. All 6 features are equally polished — no feature looks like an afterthought
3. The app passes the "drunk test" — usable with impaired motor skills (large targets, simple flows)
4. The app passes the "screenshot test" — any screenshot looks like a real iOS app
5. All data is mocked but believable — no "Lorem ipsum" or "Test User"
6. Zero runtime errors in the console during normal usage
7. 80%+ test coverage enforced by coverage gate in Phase 6

---

## Dependencies Between Phases

```
Phase 1 (Foundation + Test Setup)
         │
         ▼
Phase 2 (Types + Mock Data + Stores)
         │
         ▼
Phase 3 (Drinks + Safety)
         │
         ▼
Phase 4 (Leaderboard + Party)
         │
         ▼
Phase 5 (Recap + Social + Engagement)
         │
         ▼
Phase 6 (Polish + Coverage Gate)
```

All phases are strictly sequential. No phase may begin until the prior phase's acceptance criteria are fully satisfied. This prevents interface drift and ensures each phase builds on a stable foundation.

---

## Tech Stack Summary

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Build | Vite 6 | Fastest dev server, instant HMR |
| Framework | React 19 | Standard, wide ecosystem |
| Language | TypeScript (strict) | Type safety for mock data contracts |
| Styling | Tailwind CSS v4 | Utility-first, dark theme trivial, design token integration |
| State | Zustand (3 stores) | Minimal, immutable-friendly, no boilerplate |
| Routing | React Router v7 (client-side basic) | `<BrowserRouter>` + `<Routes>` + `<Route>` only — no `createBrowserRouter`, no data routers, no framework mode |
| Animation | Framer Motion | iOS-quality spring animations, gesture support, AnimatePresence |
| Icons | Lucide React | Clean, iOS-style icon set |
| Font | Inter (Google Fonts) + system-ui fallback | Avoids SF Pro licensing issues |
| Testing | Vitest + React Testing Library | Shares Vite config, zero overhead, jsdom environment |
| Coverage | @vitest/coverage-v8 | Native V8 coverage, 80% threshold enforced |
