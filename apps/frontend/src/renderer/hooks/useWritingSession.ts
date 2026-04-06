import { useEffect, useMemo, useRef, useState } from "react";
import type { AuthState } from "../types/auth";
import type { PasteSnapshot } from "./usePasteDetection";
import type { TimingSnapshot } from "./useKeystrokeTiming";
import type { SaveStatus, WritingSessionPayload } from "../types/session";
import { createWritingSession, updateWritingSession } from "../services/sessionApi";

const SAVE_DEBOUNCE_MS = 1200;

type SessionArgs = {
  auth: AuthState;
  text: string;
  wordCount: number;
  timingSnapshot: TimingSnapshot;
  pasteSnapshot: PasteSnapshot;
};

type SavedSnapshot = {
  text: string;
  wordCount: number;
  timingTotal: number;
  avgHoldMs: number | null;
  avgGapMs: number | null;
  pasteTotalEvents: number;
  pasteTotalChars: number;
};

const buildSavedSnapshot = (payload: WritingSessionPayload): SavedSnapshot => ({
  text: payload.content,
  wordCount: payload.wordCount,
  timingTotal: payload.timingSummary.totalKeystrokes,
  avgHoldMs: payload.timingSummary.avgHoldMs,
  avgGapMs: payload.timingSummary.avgGapMs,
  pasteTotalEvents: payload.pasteSummary.totalEvents,
  pasteTotalChars: payload.pasteSummary.totalChars
});

export const useWritingSession = ({
  auth,
  text,
  wordCount,
  timingSnapshot,
  pasteSnapshot
}: SessionArgs) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const pendingTimeoutRef = useRef<number | null>(null);
  const lastSavedRef = useRef<SavedSnapshot>({
    text: "",
    wordCount: 0,
    timingTotal: 0,
    avgHoldMs: null,
    avgGapMs: null,
    pasteTotalEvents: 0,
    pasteTotalChars: 0
  });

  const payload = useMemo<WritingSessionPayload>(
    () => ({
      content: text,
      wordCount,
      timingSummary: {
        totalKeystrokes: timingSnapshot.total,
        avgHoldMs: timingSnapshot.avgHoldMs,
        avgGapMs: timingSnapshot.avgGapMs
      },
      pasteSummary: {
        totalEvents: pasteSnapshot.totalEvents,
        totalChars: pasteSnapshot.totalChars
      }
    }),
    [
      text,
      wordCount,
      timingSnapshot.total,
      timingSnapshot.avgHoldMs,
      timingSnapshot.avgGapMs,
      pasteSnapshot.totalEvents,
      pasteSnapshot.totalChars
    ]
  );

  const clearPendingSave = () => {
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  };

  const resetSession = (status: SaveStatus = "idle") => {
    clearPendingSave();
    setSessionId(null);
    setSaveStatus(status);
    lastSavedRef.current = {
      text: "",
      wordCount: 0,
      timingTotal: 0,
      avgHoldMs: null,
      avgGapMs: null,
      pasteTotalEvents: 0,
      pasteTotalChars: 0
    };
  };

  const startNewSession = () => {
    resetSession("idle");
  };

  const primeSession = (id: string, payload: WritingSessionPayload) => {
    clearPendingSave();
    setSessionId(id);
    lastSavedRef.current = buildSavedSnapshot(payload);
    setSaveStatus("saved");
  };

  useEffect(() => {
    resetSession("idle");
  }, [auth.user?.id]);

  useEffect(() => {
    return () => {
      clearPendingSave();
    };
  }, []);

  useEffect(() => {
    if (!auth.user || !auth.token) {
      return;
    }

    const hasContent = text.trim().length > 0;
    if (!sessionId && !hasContent) {
      return;
    }

    const lastSaved = lastSavedRef.current;
    const hasChanges =
      text !== lastSaved.text ||
      wordCount !== lastSaved.wordCount ||
      timingSnapshot.total !== lastSaved.timingTotal ||
      timingSnapshot.avgHoldMs !== lastSaved.avgHoldMs ||
      timingSnapshot.avgGapMs !== lastSaved.avgGapMs ||
      pasteSnapshot.totalEvents !== lastSaved.pasteTotalEvents ||
      pasteSnapshot.totalChars !== lastSaved.pasteTotalChars;

    if (!hasChanges) {
      return;
    }

    clearPendingSave();
    pendingTimeoutRef.current = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          currentSessionId = await createWritingSession(auth.token, payload);
          setSessionId(currentSessionId);
        } else {
          await updateWritingSession(auth.token, currentSessionId, payload);
        }

        lastSavedRef.current = buildSavedSnapshot(payload);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      clearPendingSave();
    };
  }, [
    auth.user,
    auth.token,
    text,
    wordCount,
    timingSnapshot.total,
    timingSnapshot.avgHoldMs,
    timingSnapshot.avgGapMs,
    pasteSnapshot.totalEvents,
    pasteSnapshot.totalChars,
    sessionId,
    payload
  ]);

  return { saveStatus, primeSession, startNewSession };
};
