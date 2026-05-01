import { useState, useEffect, useCallback } from 'react';

interface UseTimerReturn {
  totalSeconds: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isRunning: boolean;
  pause: () => void;
  resume: () => void;
}

export function useTimer(initialSeconds: number = 3600): UseTimerReturn {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || totalSeconds <= 0) return;

    const interval = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, totalSeconds]);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  return { totalSeconds, minutes, seconds, formatted, isRunning, pause, resume };
}