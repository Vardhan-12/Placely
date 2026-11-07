// useAutoRefresh.js - Custom hook to refetch data on window focus and optional interval
// Features: throttled window focus (15s), background refetch (no skeletons if data exists), pauses when tab hidden

import { useEffect, useRef, useCallback } from "react";

/**
 * @param {Function} fetchFn - Async or sync function to fetch data. Should accept ({ isBackground: boolean })
 * @param {Object} options
 * @param {number|null} [options.intervalMs=null] - Polling interval in ms (e.g. 30000 for 30s)
 * @param {boolean} [options.enabled=true] - Whether auto refresh is active
 * @param {number} [options.focusThrottleMs=15000] - Minimum time between window focus refetches
 */
export const useAutoRefresh = (
  fetchFn,
  { intervalMs = null, enabled = true, focusThrottleMs = 15000 } = {}
) => {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const lastFetchTimeRef = useRef(Date.now());

  const triggerFetch = useCallback((isBackground = true) => {
    lastFetchTimeRef.current = Date.now();
    try {
      fetchRef.current({ isBackground });
    } catch (err) {
      console.error("Auto refresh error:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Window focus & tab visibility listener (throttled to focusThrottleMs)
    const handleFocusOrVisible = () => {
      if (document.hidden) return;
      const now = Date.now();
      if (now - lastFetchTimeRef.current >= focusThrottleMs) {
        triggerFetch(true);
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    // Interval timer (pauses when document.hidden is true)
    let intervalId = null;
    if (intervalMs && intervalMs > 0) {
      intervalId = setInterval(() => {
        if (!document.hidden) {
          triggerFetch(true);
        }
      }, intervalMs);
    }

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      if (intervalId) clearInterval(intervalId);
    };
  }, [enabled, intervalMs, focusThrottleMs, triggerFetch]);
};

export default useAutoRefresh;

