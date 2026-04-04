import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield } from 'lucide-react';

import { TopBar } from './design-system/components/TopBar';
import { TabBar } from './design-system/components/TabBar';
import { pageTransition, fadeIn } from './design-system/animations';
import { SafetyMonitor } from './features/safety/SafetyMonitor';
import { SafetyAlertOverlay } from './features/safety/SafetyAlert';
import { SafetyDashboard } from './features/safety/SafetyDashboard';

// Lazy-loaded feature tabs — keeps initial bundle small
const DrinksTab = lazy(() =>
  import('./features/drinks/DrinksTab').then((m) => ({ default: m.DrinksTab }))
);
const LeaderboardTab = lazy(() =>
  import('./features/leaderboard/LeaderboardTab').then((m) => ({ default: m.LeaderboardTab }))
);
const PartyTab = lazy(() =>
  import('./features/party/PartyTab').then((m) => ({ default: m.PartyTab }))
);
const RecapTab = lazy(() =>
  import('./features/recap/RecapTab').then((m) => ({ default: m.RecapTab }))
);
const SocialTab = lazy(() =>
  import('./features/social/SocialTab').then((m) => ({ default: m.SocialTab }))
);
const ProfileStats = lazy(() =>
  import('./engagement/ProfileStats').then((m) => ({ default: m.ProfileStats }))
);

// Shared skeleton fallback while a lazy tab is loading
function TabSkeleton() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 p-4"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-surface-raised animate-pulse border border-border-subtle" />
      ))}
    </motion.div>
  );
}

// Route config — title lookup
const routeTitles: Record<string, string> = {
  '/drinks': 'Drinks',
  '/leaderboard': 'Leaderboard',
  '/party': 'Party',
  '/recap': 'Recap',
  '/profile': 'Profile',
};

export default function App() {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] ?? 'App Party';
  const [safetyOpen, setSafetyOpen] = useState(false);

  return (
    <div className="phone-frame-wrapper">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="flex flex-col bg-base relative phone-screen" style={{ height: '100%' }}>
          <SafetyMonitor />
          <SafetyAlertOverlay />
          <SafetyDashboard isOpen={safetyOpen} onClose={() => setSafetyOpen(false)} />

          <TopBar
            title={pageTitle}
            rightAction={
              <button
                onClick={() => setSafetyOpen(true)}
                className="w-10 h-10 flex items-center justify-center cursor-pointer"
                aria-label="Open safety stats"
              >
                <Shield size={20} className="text-text-secondary" />
              </button>
            }
          />

          <main
            className="flex-1 overflow-y-auto"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="min-h-full"
              >
                <Suspense fallback={<TabSkeleton />}>
                  <Routes location={location}>
                    <Route index element={<Navigate to="/party" replace />} />
                    <Route path="/drinks" element={<DrinksTab />} />
                    <Route path="/leaderboard" element={<LeaderboardTab />} />
                    <Route path="/party" element={<PartyTab />} />
                    <Route path="/recap" element={<RecapTab />} />
                    <Route path="/social" element={<SocialTab />} />
                    <Route path="/profile" element={<ProfileStats />} />
                    <Route path="*" element={<Navigate to="/party" replace />} />
                  </Routes>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>

          <TabBar />
        </div>
      </div>
    </div>
  );
}
