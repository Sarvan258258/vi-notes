import { useCallback, useEffect, useState } from "react";
import type { WritingSessionDetail, WritingSessionSummary } from "../types/session";
import { getWritingSession, listWritingSessions } from "../services/sessionApi";

export const useSessionLibrary = (token: string | null) => {
  const [sessions, setSessions] = useState<WritingSessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<WritingSessionDetail | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setSessions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await listWritingSessions(token);
      setSessions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const selectSession = useCallback(
    async (id: string) => {
      if (!token) {
        return;
      }
      setSelectedSessionId(id);
      setDetailLoading(true);
      setError(null);
      try {
        const session = await getWritingSession(token, id);
        setSelectedSession(session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session.");
      } finally {
        setDetailLoading(false);
      }
    },
    [token]
  );

  const clearSelection = useCallback(() => {
    setSelectedSession(null);
    setSelectedSessionId(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setSessions([]);
      clearSelection();
      setError(null);
      return;
    }
    refresh();
  }, [token, refresh, clearSelection]);

  return {
    sessions,
    selectedSession,
    selectedSessionId,
    loading,
    detailLoading,
    error,
    refresh,
    selectSession,
    clearSelection
  };
};
