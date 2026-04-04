# Open Questions

## app-party-plan - 2026-04-03

- [ ] Avatar images: Use DiceBear API (generates SVG avatars from seeds) or static placeholder images? — Affects mock data setup and offline capability
- [ ] Drink emoji vs. drink images: Should drink cards use emoji icons (simpler, no assets) or placeholder food photography? — Affects visual polish level
- [ ] PWA manifest: Should the app include a web app manifest for Add to Home Screen? — Would make it feel more native on iPhone but adds scope
- [ ] Sound effects: Should badge unlocks and level-ups have audio feedback? — Adds polish but increases asset requirements
- [ ] Recap data generation: Should recaps auto-generate from tonight's drink data, or only show pre-built mock recaps? — Auto-generation is more impressive but more complex
- [ ] Tab count: Spec says 5 tabs but there are 6 features. Current plan uses 5 tabs (Drinks, Leaderboard, Party, Social, Profile) with Safety accessible from Profile and Recap accessible from a dedicated tab or Profile sub-view. Confirm tab layout. — Affects navigation architecture

## partytrack-prod-plan - 2026-04-03

- [ ] Zustand retention or removal: Should Zustand remain as a client-side cache layer over Supabase queries, or be fully replaced with custom hooks + React Query / SWR? — Affects caching strategy, offline support complexity, and refactoring scope across all 3 stores
- [ ] Supabase project tier: Free tier has limits (500MB database, 1GB storage, 500K Edge Function invocations/month). When should the project move to Pro ($25/mo)? — Determines whether rate limits are soft (self-imposed) or hard (platform-enforced)
- [ ] Night-end detection timezone handling: Cron runs at UTC. Users in different timezones may have different "midnight-6am" windows. Should detection use the party's venue timezone or each member's timezone? — Incorrect timezone handling causes false positives/negatives
- [ ] Camera roll sync privacy: When syncing camera roll photos, should the app upload ALL photos taken during party hours, or require explicit user selection per photo? — Privacy implications; auto-upload could capture sensitive images
- [ ] Invite link domain: The plan references `partytrack.app/join?code=XXXXXX`. Is this domain registered? Should invites use a Supabase-hosted redirect or a custom domain? — Affects invite link UX and branding
- [ ] GPT-4o vision model fallback: If OpenAI rate-limits or has an outage, should the scan feature fall back to a local model (e.g., ONNX in-browser), or just show "manual add" UI? — Affects resilience and offline capability of scanning
- [ ] Google Places API billing: The plan uses Nearby Search which costs $17/1000 calls. With location logged every 5 min per user, a 4-hour party with 6 members = ~288 calls. At scale, should we cache venue lookups or use a free alternative (e.g., Overpass/OSM)? — Direct cost implication at scale
- [ ] Supabase Realtime connection limits: Free tier allows 200 concurrent connections. Each party member subscribes to party_members + consumption_log channels. With 100 concurrent users, this could hit limits. When should we implement connection pooling or upgrade? — Affects scalability of real-time features
