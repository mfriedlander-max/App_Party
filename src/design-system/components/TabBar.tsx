import { NavLink } from 'react-router-dom';
import { Wine, Trophy, PartyPopper, Film, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { springs } from '../animations';

interface Tab {
  readonly path: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly activeIcon: React.ReactNode;
}

const tabs: readonly Tab[] = [
  {
    path: '/drinks',
    label: 'Drinks',
    icon: <Wine size={24} strokeWidth={1.5} />,
    activeIcon: <Wine size={24} strokeWidth={2.5} />,
  },
  {
    path: '/leaderboard',
    label: 'Leaders',
    icon: <Trophy size={24} strokeWidth={1.5} />,
    activeIcon: <Trophy size={24} strokeWidth={2.5} />,
  },
  {
    path: '/party',
    label: 'Party',
    icon: <PartyPopper size={24} strokeWidth={1.5} />,
    activeIcon: <PartyPopper size={24} strokeWidth={2.5} />,
  },
  {
    path: '/recap',
    label: 'Recap',
    icon: <Film size={24} strokeWidth={1.5} />,
    activeIcon: <Film size={24} strokeWidth={2.5} />,
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: <User size={24} strokeWidth={1.5} />,
    activeIcon: <User size={24} strokeWidth={2.5} />,
  },
];

export function TabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'var(--theme-tabbar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--theme-tabbar-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-[80px]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className="flex-1"
            aria-label={tab.label}
          >
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.88 }}
                transition={springs.snappy}
                className="flex flex-col items-center justify-center h-full gap-1 cursor-pointer"
              >
                <span
                  className="transition-colors duration-150"
                  style={{ color: isActive ? '#FF2D55' : '#5A5A70' }}
                >
                  {isActive ? tab.activeIcon : tab.icon}
                </span>
                <span
                  className="text-[11px] font-semibold leading-none transition-colors duration-150"
                  style={{ color: isActive ? '#FF2D55' : '#5A5A70' }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute bottom-0 w-6 h-0.5 rounded-full bg-[#FF2D55]"
                    transition={springs.tabSwitch}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
