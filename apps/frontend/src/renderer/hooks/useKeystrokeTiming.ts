import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type KeystrokeTiming = {
  holdMs: number;
  interKeyMs: number | null;
  timestamp: number;
};

export type TimingSnapshot = {
  total: number;
  avgHoldMs: number | null;
  avgGapMs: number | null;
  lastHoldMs: number | null;
  lastGapMs: number | null;
};

const MAX_TIMING_EVENTS = 2000;
const TIMING_UI_INTERVAL_MS = 200;

export const useKeystrokeTiming = (sessionKey: string | null) => {
  const [timingSnapshot, setTimingSnapshot] = useState<TimingSnapshot>({
    total: 0,
    avgHoldMs: null,
    avgGapMs: null,
    lastHoldMs: null,
    lastGapMs: null
  });

  const downStateRef = useRef(new Map<string, { downAt: number; gapMs: number | null }>());
  const lastKeydownAtRef = useRef<number | null>(null);
  const timingEventsRef = useRef<KeystrokeTiming[]>([]);
  const timingStatsRef = useRef({
    total: 0,
    holdSum: 0,
    gapSum: 0,
    gapCount: 0,
    lastHold: null as number | null,
    lastGap: null as number | null
  });
  const lastUiUpdateRef = useRef(0);

  const resetTiming = () => {
    timingEventsRef.current = [];
    downStateRef.current.clear();
    lastKeydownAtRef.current = null;
    timingStatsRef.current = {
      total: 0,
      holdSum: 0,
      gapSum: 0,
      gapCount: 0,
      lastHold: null,
      lastGap: null
    };
    lastUiUpdateRef.current = 0;
    setTimingSnapshot({
      total: 0,
      avgHoldMs: null,
      avgGapMs: null,
      lastHoldMs: null,
      lastGapMs: null
    });
  };

  useEffect(() => {
    resetTiming();
  }, [sessionKey]);

  const formatMs = (value: number | null) => (value === null ? "—" : `${value} ms`);

  const recordTiming = (holdMs: number, gapMs: number | null) => {
    const stats = timingStatsRef.current;
    stats.total += 1;
    stats.holdSum += holdMs;
    stats.lastHold = holdMs;
    if (gapMs !== null) {
      stats.gapSum += gapMs;
      stats.gapCount += 1;
      stats.lastGap = gapMs;
    }

    timingEventsRef.current.push({
      holdMs,
      interKeyMs: gapMs,
      timestamp: Date.now()
    });

    if (timingEventsRef.current.length > MAX_TIMING_EVENTS) {
      timingEventsRef.current.shift();
    }

    const now = Date.now();
    if (now - lastUiUpdateRef.current >= TIMING_UI_INTERVAL_MS) {
      lastUiUpdateRef.current = now;
      setTimingSnapshot({
        total: stats.total,
        avgHoldMs: Math.round(stats.holdSum / stats.total),
        avgGapMs: stats.gapCount ? Math.round(stats.gapSum / stats.gapCount) : null,
        lastHoldMs: stats.lastHold,
        lastGapMs: stats.lastGap
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.isComposing || event.repeat) {
      return;
    }

    const now = Date.now();
    const lastDown = lastKeydownAtRef.current;
    const gapMs = lastDown ? now - lastDown : null;

    lastKeydownAtRef.current = now;
    // Store only timing data; key identities are not persisted.
    downStateRef.current.set(event.code, { downAt: now, gapMs });
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.isComposing) {
      return;
    }

    const entry = downStateRef.current.get(event.code);
    if (!entry) {
      return;
    }

    downStateRef.current.delete(event.code);
    const holdMs = Math.max(0, Date.now() - entry.downAt);
    recordTiming(holdMs, entry.gapMs);
  };

  return {
    timingSnapshot,
    handleKeyDown,
    handleKeyUp,
    formatMs
  };
};
