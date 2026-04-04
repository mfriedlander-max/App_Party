import { useState, useEffect } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function parseInset(property: string): number {
  if (typeof window === 'undefined') return 0;
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.top = '0';
  el.style.left = '0';
  el.style.width = '0';
  el.style.height = '0';
  el.style.padding = `env(${property}, 0px)`;
  document.body.appendChild(el);
  const computed = parseFloat(getComputedStyle(el).paddingTop);
  document.body.removeChild(el);
  return isNaN(computed) ? 0 : computed;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    setInsets({
      top: parseInset('safe-area-inset-top'),
      bottom: parseInset('safe-area-inset-bottom'),
      left: parseInset('safe-area-inset-left'),
      right: parseInset('safe-area-inset-right'),
    });
  }, []);

  return insets;
}
