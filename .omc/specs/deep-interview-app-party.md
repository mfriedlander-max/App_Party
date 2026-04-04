# Deep Interview Spec: App_Party

## Metadata
- Interview ID: app-party-001
- Rounds: 7
- Final Ambiguity Score: 19.5%
- Type: greenfield
- Generated: 2026-04-03
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.85 | 0.40 | 0.34 |
| Constraint Clarity | 0.85 | 0.30 | 0.255 |
| Success Criteria | 0.70 | 0.30 | 0.21 |
| **Total Clarity** | | | **0.805** |
| **Ambiguity** | | | **19.5%** |

## Goal
Build a fully polished, demo-quality iPhone-styled web app for social drinking experiences. The core differentiator is AI-powered drink photo recognition that estimates alcohol content from photos. The app integrates six equally weighted features — drink tracking, leaderboards, night recaps, safety alerts, social media post generation, and party/invite management — all with mocked data behind a production-quality UI.

## Constraints
- **Platform:** Mobile web app (React + Tailwind CSS) styled to look and feel like a native iPhone app
- **Tech Stack:** React, Tailwind CSS, iOS design language (safe areas, SF Pro-style typography, bottom tab bar, iOS-style cards/transitions/animations)
- **Backend:** None — all data mocked in-memory with realistic fake data
- **APIs:** No real integrations — all features (drink recognition, social sharing, notifications) are simulated
- **Quality Bar:** Demo-quality, not a prototype. Must look and feel like a real shipped product
- **Photos:** User can provide sample photos; mock recognition returns plausible estimates
- **Social Model:** UI shows full party creation, invite link/text flows, and friend system — all backed by mocked data

## Non-Goals
- Real AI/ML drink recognition (mocked with plausible responses)
- Real backend or database (in-memory mocked data)
- Real social media API integration (simulated share flows)
- Real push notifications (in-app simulated alerts)
- Android-specific styling
- App store deployment
- User authentication with a real auth provider

## Acceptance Criteria
- [ ] **Drink Tracking:** User can "take a photo" (select/upload an image), and the app displays a convincing alcohol content estimate (e.g., "2.5 shots equivalent") with a running total against a personalized safe limit
- [ ] **Leaderboard:** A scrollable leaderboard shows the user and mocked friends ranked by drink count, updates when the user logs a drink
- [ ] **Night Recap:** A slideshow/story view compiles photos and videos from the session with a fun narrative overlay, playable as a sequence
- [ ] **Safety Alerts:** When the user's tracked intake approaches a configurable danger threshold, a visible in-app notification/alert fires
- [ ] **Social Media Integration:** A "Share" flow generates an Instagram-ready image/card with auto-generated caption and hashtags (e.g., #Party), with a copy/share action
- [ ] **Party & Social:** User can create a party, see an invite link/code, view a mocked friends list, and see friends "join" the party
- [ ] **iOS Look & Feel:** Bottom tab navigation, safe area handling, SF Pro-style fonts, iOS-style transitions, rounded cards, and native-feeling interactions
- [ ] **Responsive:** Works correctly in mobile viewport (375px–430px width range)
- [ ] **Navigation:** All 6 features accessible within 2 taps from the home screen

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| Features have a priority hierarchy | "Is this a drink tracker or a social app?" | All features equally weighted, fully integrated |
| Real APIs needed | Implicit assumption about integrations | All features mocked — no real APIs, backends, or ML |
| Prototype-level quality is OK | "What would make you say 'done'?" | Full polish required — must look like a real shipped product |
| Drink recognition needs real AI | "What if it was unreliable?" | It's THE differentiator — must feel convincing even as a mock |
| Social features need real multiplayer | "How do parties work?" | Full invite/friend UX designed, all backed by mocked data |
| Some features could be simplified | Simplifier challenge: "What's the MVP?" | No shortcuts — full polish on all 6 features |
| Could be React Native or native | "Native or web?" | React + Tailwind web app styled as iOS |

## Technical Context
- **Framework:** React (with optional Next.js) + Tailwind CSS
- **Design System:** iOS design language — SF Pro typography, bottom tab bar, safe areas, rounded cards, iOS-style modals/sheets, smooth transitions
- **Data Layer:** In-memory mocked data with realistic fake users, drinks, parties, and social interactions
- **Image Handling:** File input or camera API for drink photos; mock recognition returns randomized but plausible alcohol estimates based on drink type
- **State Management:** React state/context (no external state library needed for a mocked app)
- **Animations:** CSS transitions or Framer Motion for iOS-style page transitions and micro-interactions

## UX Research Findings

### Anti-Vibe-Code Design Rules
- **No purple/indigo gradients** — the #1 tell of AI-generated apps. Use hot pink accent (`#FF2D55`, Apple's system pink) for nightlife energy
- **Strict 8px grid** — every spacing value is a multiple of 4px, with 8 as primary unit
- **5-7 type levels used consistently** — not random sizing. Follow iOS type scale (11px caption to 34px large title)
- **Functional animations only** — communicate state changes, not decoration. iOS easing: `cubic-bezier(0.25, 0.1, 0.25, 1.0)`
- **Designed empty/loading/error states** — skeleton shimmer loaders, not spinners. Custom empty states with copy
- **Photography drives visual interest** — not illustrations or generic gradients
- **Components adapted per context** — no copy-paste identical cards everywhere
- **Maximum 2 accent colors** with clear semantic roles (primary: `#FF2D55`, secondary: `#00E5FF`)

### Tailwind Color Palette (Dark Nightlife Theme)
```
Backgrounds (60% of UI):
  surface:         #0A0A0F  (deep background, blue-tinted black)
  surface-raised:  #13131A  (cards, elevated surfaces)
  surface-overlay: #1C1C26  (modals, sheets)
  surface-subtle:  #252530  (hover states, dividers)

Text hierarchy:
  content:           #F0F0F5  (primary — off-white, not pure white)
  content-secondary: #9494A8  (metadata, timestamps)
  content-tertiary:  #5C5C70  (disabled, placeholders)

Accents:
  accent:    #FF2D55  (hot pink — primary CTA, nightlife energy)
  glow:      #00E5FF  (cyan — secondary interactive elements)

Semantic:
  success: #30D158  |  warning: #FFD60A  |  error: #FF453A

Borders:
  border:        #ffffff0F  (6% white — subtle)
  border-strong: #ffffff1A  (10% white — emphasis)
```

### iOS Component Patterns
- **Bottom tab bar:** 49px height + safe area, translucent blur background (`backdrop-filter: blur(20px) saturate(180%)`), max 4-5 tabs, filled/outline icon states
- **Cards:** 12px border-radius (standard), 16px (featured), no visible border, subtle elevation via box-shadow, 16px internal padding
- **Sheet modals:** 12px top border-radius, 36x5px drag handle, snap points at 25%/50%/92%
- **Navigation:** 44px content height, 17px semibold centered title, large title (34px bold) collapses on scroll
- **Border radius scale:** 4px (chips) → 8px (buttons) → 12px (cards) → 16px (modals) → 20px (hero) → full (avatars)

### Drunk-Friendly UX (Critical for Party App)
- **Tap targets:** 60pt minimum, 72pt for primary CTAs (35-65% larger than standard 44pt)
- **Spacing between targets:** 12-16px minimum (prevents accidental taps)
- **Font sizes:** 18px body minimum, 20px buttons, semibold (600) weight for all interactive text
- **Contrast:** Minimum 7:1 for primary text (WCAG AAA), 4.5:1 for secondary
- **Dark theme only:** `#0A0A0F` base (not pure black — avoids OLED halation), `#F0F0F5` text (not pure white — reduces eye strain)
- **Max 3 taps** to complete any core action
- **Max 4 nav options** visible at once
- **Icons always paired with text labels** — impaired users can't decode abstract symbols
- **No text input for core flows** — use tap-to-select, toggles, pre-filled defaults
- **No time-limited interactions** — no auto-dismissing elements under 10 seconds
- **Undo available for 10+ seconds** on all non-destructive actions
- **One primary action per screen** — make main CTA visually dominant
- **Bottom-anchored primary actions** — thumb-reachable one-handed use (user may hold a drink)
- **6th-grade reading level** for all copy, button labels 1-3 words

### Engagement & Retention Hooks
**Hook Model (Trigger → Action → Variable Reward → Investment):**
- **Triggers:** Friend activity notifications ("Jake logged drink #5"), weekend recap digests (Friday PM), streak reminders, leaderboard shift alerts (loss aversion)
- **Actions:** One-tap drink logging (<3 seconds), quick reactions to friends (toast/cheers)
- **Variable Rewards:** Morning-after recap (you don't know what highlights appear), surprise superlatives ("Most Adventurous Drinker"), hidden badge unlocks, leaderboard changes
- **Investment:** Drink history, friend graph, party memories archive, reputation/rank, customization

**Gamification:**
- **Weekend Warrior Streaks** (consecutive weekends, not daily — matches natural cadence) with streak shields
- **Badge system:** Drink Explorer, Social, Seasonal/Event, Hidden/Surprise badges with rarity tiers (Common → Legendary)
- **XP/Level progression:** Titles evolve (Lightweight → Social Sipper → Party Regular → Legend)
- **Friend challenges:** Head-to-head, group vs group, dare challenges

**Night Recap as Retention Driver (highest-leverage feature for next-day opens):**
- Swipeable story format (like Spotify Wrapped): Stats Card → Leaderboard Shift → Timeline → Superlatives → Photo Reel → Group Card → Milestone Check
- Morning-after notification at 10am-12pm with curiosity gap ("Your night recap is ready...")
- Every card designed for Instagram Story screenshots (free user acquisition)
- Longitudinal recaps: morning-after → weekend summary → monthly → annual "Year Wrapped"

**Social Loops:**
- Time-limited party stories (24h visibility, then private archive)
- "Who's out tonight?" live activity feed
- Reciprocity: friend tags, score challenges, toast reactions
- BeReal-style "Party Check" (random notification during party hours, dual camera)

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| User | core domain | name, avatar, weight, gender, drinkCount, safeLimit | has many Drinks, participates in Party, appears on Leaderboard |
| Drink | core domain | photo, type, alcoholContent, shotEquivalent, timestamp | belongs to User, tracked in Party |
| Party | core domain | name, date, location, inviteCode, status | has many Users, has Leaderboard, has Recap, has Invites |
| Leaderboard | supporting | rankings, entries, sortOrder | belongs to Party, ranks Users by drinkCount |
| Recap | supporting | photos, videos, narrative, slides | belongs to Party, compiled from User media |
| SafetyAlert | supporting | threshold, severity, message, triggered | triggered for User based on drinkCount vs safeLimit |
| SocialPost | supporting | image, caption, hashtags, platform | generated from Recap or Party highlights |
| Invite | supporting | link, code, sentVia, status | belongs to Party, targets a User |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 7 | 7 | - | - | - |
| 2 | 7 | 0 | 0 | 7 | 100% |
| 3 | 7 | 0 | 0 | 7 | 100% |
| 4 | 7 | 0 | 0 | 7 | 100% |
| 5 | 8 | 1 | 0 | 7 | 88% |
| 6 | 8 | 0 | 0 | 8 | 100% |
| 7 | 8 | 0 | 0 | 8 | 100% |

## Interview Transcript
<details>
<summary>Full Q&A (7 rounds)</summary>

### Round 1
**Q:** When a user opens App_Party for the very first time on a night out, what is the ONE thing they do first? Is this primarily a drink-tracking tool that happens to have social features, or a social/party app that happens to track drinks?
**A:** I want all of these features to be integrated, no APIs yet, or real integrations all mock up features. ALL features integrated is key.
**Ambiguity:** 65% (Goal: 0.50, Constraints: 0.40, Criteria: 0.10)

### Round 2
**Q:** If I handed you the finished App_Party on your phone right now, what would you tap through to say 'yes, this is done'?
**A:** All of these are important. Especially that it looks real etc, do research onto the best practices not making a vibe coded app, and then it will be through a phone.
**Ambiguity:** 49% (Goal: 0.60, Constraints: 0.50, Criteria: 0.40)

### Round 3
**Q:** You said it runs on a phone. Is this a native mobile app or a mobile-responsive web app?
**A:** I want it to be mocked up as if it was an iPhone app.
**Ambiguity:** 43% (Goal: 0.65, Constraints: 0.60, Criteria: 0.45)

### Round 4 (Contrarian Mode)
**Q:** What if the drink photo recognition turned out to be unreliable or complex to mock convincingly — would the app still be valuable without it?
**A:** It's THE differentiator.
**Ambiguity:** 36% (Goal: 0.75, Constraints: 0.60, Criteria: 0.55)

### Round 5
**Q:** How do the social features actually work? Does one person create a 'party' and invite friends, or is it all mocked?
**A:** UI shows party creation, you either can share a link to sign up or text a link to sign up and friend people kind of idea, it should be mocked with friends though.
**Ambiguity:** 31% (Goal: 0.80, Constraints: 0.70, Criteria: 0.55)

### Round 6 (Simplifier Mode)
**Q:** What's the simplest version that would still impress someone seeing a demo?
**A:** Full polish on all 6.
**Ambiguity:** 26% (Goal: 0.85, Constraints: 0.70, Criteria: 0.65)

### Round 7
**Q:** For the tech stack: React + Tailwind styled as iOS, or something else?
**A:** React + Tailwind (Recommended).
**Ambiguity:** 19.5% (Goal: 0.85, Constraints: 0.85, Criteria: 0.70)

</details>
