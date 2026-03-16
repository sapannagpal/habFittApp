/**
 * useSessionTimer — counts elapsed seconds upward when isActive=true.
 *
 * Returns { seconds, reset }.
 * Uses setInterval with a 1-second tick.
 * Automatically clears the interval on unmount or when isActive becomes false.
 *
 * @param {boolean} isActive — when true, the timer ticks; when false, it pauses
 * @returns {{ seconds: number, reset: () => void }}
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export function useSessionTimer(isActive) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  const reset = useCallback(() => setSeconds(0), []);

  return { seconds, reset };
}
