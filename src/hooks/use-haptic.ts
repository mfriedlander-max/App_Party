function vibrate(ms: number): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}

export function useHaptic() {
  return {
    light: () => vibrate(10),
    medium: () => vibrate(25),
    heavy: () => vibrate(50),
  };
}
