"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoRefreshOptions {
  interval?: number; // ms, default 30000
  onRefresh?: () => void;
}

export function useAutoRefresh({ interval = 30000, onRefresh }: UseAutoRefreshOptions = {}) {
  const [countdown, setCountdown] = useState(interval / 1000);
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setLastRefreshed(new Date());
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 800);
    setCountdown(interval / 1000);
  }, [interval, onRefresh]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!isPaused) {
      setCountdown(interval / 1000);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) return interval / 1000;
          return prev - 1;
        });
      }, 1000);

      intervalRef.current = setInterval(() => {
        refresh();
      }, interval);
    }
  }, [isPaused, interval, refresh]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isPaused, resetTimer]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const manualRefresh = useCallback(() => {
    refresh();
    resetTimer();
  }, [refresh, resetTimer]);

  return {
    countdown,
    isPaused,
    isRefreshing,
    lastRefreshed,
    togglePause,
    manualRefresh,
  };
}
