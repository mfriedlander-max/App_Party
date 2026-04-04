import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeStore {
  readonly theme: Theme;
  readonly toggleTheme: () => void;
}

function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(theme);
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark' as Theme,
      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'app-party-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    },
  ),
);
