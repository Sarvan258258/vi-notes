import React from "react";
import type { WritingSessionDetail, WritingSessionSummary } from "../types/session";

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

type SessionsPanelProps = {
  sessions: WritingSessionSummary[];
  selectedSessionId: string | null;
  selectedSession: WritingSessionDetail | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  onOpen: (session: WritingSessionDetail) => void;
  onStartNew: () => void;
};

const SessionsPanel = ({
  sessions,
  selectedSessionId,
  selectedSession,
  loading,
  detailLoading,
  error,
  onRefresh,
  onSelect,
  onOpen,
  onStartNew
}: SessionsPanelProps) => {
  const history = selectedSession?.saveHistory?.slice(-6).reverse() ?? [];

  return (
    <div className="sessions">
      <section className="sessions__panel sessions__list">
        <header className="sessions__header">
          <div>
            <p className="sessions__eyebrow">My Sessions</p>
            <h2 className="sessions__title">Recent writing</h2>
          </div>
          <div className="sessions__actions">
            <button className="button button--ghost" type="button" onClick={onRefresh}>
              Refresh
            </button>
            <button className="button" type="button" onClick={onStartNew}>
              New session
            </button>
          </div>
        </header>
        {loading ? <p className="sessions__empty">Loading sessions...</p> : null}
        {error ? <p className="sessions__error">{error}</p> : null}
        {!loading && sessions.length === 0 ? (
          <p className="sessions__empty">No saved sessions yet.</p>
        ) : null}
        <div className="sessions__list-body">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`sessions__item${
                selectedSessionId === session.id ? " is-active" : ""
              }`}
              type="button"
              onClick={() => onSelect(session.id)}
            >
              <div>
                <p className="sessions__item-title">{session.wordCount} words</p>
                <p className="sessions__item-meta">
                  Updated {formatTimestamp(session.updatedAt)}
                </p>
              </div>
              <span className="sessions__item-revisions">
                {session.revisionCount} revisions
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="sessions__panel sessions__detail">
        <header className="sessions__detail-header">
          <div>
            <p className="sessions__eyebrow">Session details</p>
            <h2 className="sessions__title">Status history</h2>
          </div>
          {selectedSession ? (
            <button className="button" type="button" onClick={() => onOpen(selectedSession)}>
              Open in editor
            </button>
          ) : null}
        </header>
        {detailLoading ? <p className="sessions__empty">Loading session...</p> : null}
        {!detailLoading && !selectedSession ? (
          <p className="sessions__empty">Select a session to view details.</p>
        ) : null}
        {selectedSession ? (
          <div className="sessions__detail-body">
            <div className="sessions__meta">
              <div>
                <span className="sessions__meta-label">Created</span>
                <span>{formatTimestamp(selectedSession.createdAt)}</span>
              </div>
              <div>
                <span className="sessions__meta-label">Last saved</span>
                <span>{formatTimestamp(selectedSession.updatedAt)}</span>
              </div>
              <div>
                <span className="sessions__meta-label">Revisions</span>
                <span>{selectedSession.revisionCount}</span>
              </div>
              <div>
                <span className="sessions__meta-label">Word count</span>
                <span>{selectedSession.wordCount}</span>
              </div>
            </div>
            <div className="sessions__summary">
              <h3>Latest summaries</h3>
              <p>Keystrokes: {selectedSession.timingSummary.totalKeystrokes}</p>
              <p>Avg hold: {selectedSession.timingSummary.avgHoldMs ?? 0} ms</p>
              <p>Avg gap: {selectedSession.timingSummary.avgGapMs ?? 0} ms</p>
              <p>Pastes: {selectedSession.pasteSummary.totalEvents}</p>
              <p>Paste chars: {selectedSession.pasteSummary.totalChars}</p>
            </div>
            <div className="sessions__history">
              <h3>Save history</h3>
              {history.length === 0 ? (
                <p className="sessions__empty">No save history yet.</p>
              ) : (
                <ul>
                  {history.map((entry) => (
                    <li key={entry}>{formatTimestamp(entry)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default SessionsPanel;
