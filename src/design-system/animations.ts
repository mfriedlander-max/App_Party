import type { Variants, Transition } from 'framer-motion';

// iOS-feel spring configurations
export const springs = {
  // Snappy default — used for most transitions
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  } satisfies Transition,

  // Bouncy — used for badges, pops
  bouncy: {
    type: 'spring',
    stiffness: 600,
    damping: 20,
    mass: 0.6,
  } satisfies Transition,

  // Gentle — used for sheets, overlays
  gentle: {
    type: 'spring',
    stiffness: 260,
    damping: 28,
    mass: 1,
  } satisfies Transition,

  // Tab switch
  tabSwitch: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.7,
  } satisfies Transition,
} as const;

// Slide up — for bottom sheets and cards entering from below
export const slideUp: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.gentle,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { ...springs.gentle, duration: 0.2 },
  },
};

// Fade in — for overlays and content areas
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// Scale pop — for badges, notifications, achievements
export const scalePop: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.bouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// Slide down — for toasts entering from top
export const slideDown: Variants = {
  hidden: {
    y: -80,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.snappy,
  },
  exit: {
    y: -80,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// Tap scale — for interactive elements
export const tapScale = {
  whileTap: { scale: 0.94 },
  transition: springs.snappy,
};

// Page transition — for route changes
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springs.gentle, delay: 0.05 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
  },
};

// Stagger children — for lists
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.snappy,
  },
};
