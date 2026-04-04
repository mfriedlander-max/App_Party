// Color tokens
export const colors = {
  base: '#0A0A0F',
  surface: '#0F0F16',
  surfaceRaised: '#13131A',
  surfaceElevated: '#1A1A24',
  border: '#2A2A38',
  borderSubtle: '#1E1E28',

  textPrimary: '#F0F0F5',
  textSecondary: '#9090A0',
  textMuted: '#5A5A70',

  accent: '#FF2D55',
  accentDim: 'rgba(255, 45, 85, 0.15)',
  accentGlow: 'rgba(255, 45, 85, 0.4)',

  glow: '#00E5FF',
  glowDim: 'rgba(0, 229, 255, 0.15)',
  glowBorder: 'rgba(0, 229, 255, 0.4)',

  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  info: '#0A84FF',
} as const;

export type ColorToken = keyof typeof colors;

// Typography scale
export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

  fontSize: {
    xs: '0.75rem',    // 13.5px
    sm: '0.875rem',   // 15.75px
    base: '1.125rem', // 18px (minimum body text)
    lg: '1.25rem',    // 22.5px
    xl: '1.375rem',   // 24.75px
    '2xl': '1.5rem',  // 27px
    '3xl': '1.75rem', // 31.5px
    '4xl': '2rem',    // 36px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
  },
} as const;

// Spacing scale (in px)
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

// Touch targets
export const touchTargets = {
  minimum: '60px',   // All interactive elements
  primary: '72px',   // Primary CTAs
  icon: '44px',      // Icon-only buttons (paired with padding)
} as const;

// Border radii
export const radii = {
  sm: '8px',
  md: '12px',    // Card radius per spec
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  card: '0 4px 24px rgba(0, 0, 0, 0.4)',
  accent: '0 0 20px rgba(255, 45, 85, 0.3)',
  glow: '0 0 20px rgba(0, 229, 255, 0.3)',
  elevated: '0 8px 32px rgba(0, 0, 0, 0.6)',
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
} as const;

// Layout constants
export const layout = {
  tabBarHeight: '80px',
  topBarHeight: '64px',
  maxWidth: '430px', // Mobile-first max width
} as const;
