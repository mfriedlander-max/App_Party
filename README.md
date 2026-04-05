# PartyTrack

PartyTrack is a mobile-first party companion app built with React, TypeScript, and Supabase. It lets you and your friends track drinks in real time, monitor BAC estimates, compete on a live leaderboard, share social moments, and receive end-of-night recaps — all inside a sleek dark-themed phone UI.

---

## Features

- **Drink logging** — Tap to log from a curated catalog or scan a drink with AI (GPT-4o vision via Supabase Edge Function)
- **BAC estimation** — Real-time blood-alcohol estimation using Widmark formula, personalized by weight, height, and biological sex
- **Live leaderboard** — Compare drink counts with friends tonight, this weekend, or all time
- **Parties** — Create or join a party via invite code; real-time member presence via Supabase Realtime
- **Friends** — Send / accept / remove friend requests with user search
- **Social feed** — Capture in-app moments and share them to the party feed; media stored in Supabase Storage
- **Safety monitor** — Automatic BAC-level alerts (safe / caution / danger) with safety dashboard
- **Night-end detection** — Detects when the party is winding down and triggers an end-of-night recap
- **Recaps** — Scrollable recap slides per party with stats, highlights, and badges earned
- **Gamification** — XP, levels, streak tracking, and 16+ unlockable achievement badges
- **Google OAuth** — Sign in with Google via Supabase Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, custom design tokens |
| Animation | Framer Motion |
| State management | Zustand |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| AI scanning | OpenAI GPT-4o vision (via Edge Function or direct client fallback) |
| Testing | Vitest, Testing Library |

---

## Environment Variables

Create a `.env` file in the project root (already in `.gitignore`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-...   # optional — only needed for local scan fallback
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in `supabase/migrations/` against your project
3. Deploy Edge Functions: `supabase functions deploy scan-drink`
4. Copy the project URL and anon key into `.env`

### Google OAuth Setup

1. In the Supabase dashboard go to **Authentication → Providers → Google**
2. Enable Google provider and add your OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
3. Add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Running Tests

```bash
npm run test
```

Tests use Vitest. All Supabase calls are mocked so no real credentials are needed for testing.

---

## Project Structure

```
src/
├── __tests__/          # Test files mirroring src structure
│   ├── features/       # Feature component tests
│   ├── lib/            # Service and repository tests
│   ├── store/          # Zustand store tests
│   └── utils/          # Utility function tests
├── data/               # Mock data (seed + offline fallback)
├── design-system/      # Reusable UI components, animations, tokens
├── engagement/         # Profile, XP, badges UI
├── features/           # Feature modules
│   ├── auth/           # AuthGate, Google OAuth
│   ├── drinks/         # Drink catalog, logging, photo scanning
│   ├── leaderboard/    # Rankings, friend comparison
│   ├── party/          # Create/join party, lobby, invite links
│   ├── recap/          # Night-end recap slides
│   ├── safety/         # BAC monitor, safety alerts
│   ├── settings/       # Camera roll sync
│   └── social/         # Social feed, capture button
├── hooks/              # Shared React hooks (auth, haptic, permissions)
├── lib/                # Core services and data access
│   ├── repositories/   # Supabase data access layer
│   ├── services/       # Business logic services (BAC, scan)
│   └── supabase.ts     # Supabase client singleton
├── store/              # Zustand stores (app, drink, party, friends)
├── types/              # TypeScript type definitions
└── utils/              # Pure utility functions
supabase/
├── functions/          # Supabase Edge Functions (Deno)
└── migrations/         # SQL schema migrations
```

---

## Production Plan

See `.omc/plans/` for the full phase-by-phase production plan used to build this app.
