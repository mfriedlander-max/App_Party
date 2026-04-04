import { useRef, useCallback, useEffect } from 'react';

interface TimerControls {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * setInterval wrapper with auto-cleanup on unmount.
 * @param callback Function to call on each tick.
 * @param intervalMs Interval in milliseconds.
 * @param autoStart Whether to start immediately on mount.
 */
export function useTimer(callback: () => void, intervalMs: number, autoStart = false): TimerControls {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref fresh without restarting the interval
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, intervalMs);
  }, [intervalMs, stop]);

  const reset = useCallback(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (autoStart) start();
    return stop;
  }, [autoStart, start, stop]);

  return { start, stop, reset };
}
