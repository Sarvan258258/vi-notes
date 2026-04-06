import React, { useEffect, useMemo, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import EditorPanel from "./components/EditorPanel";
import SessionsPanel from "./components/SessionsPanel";
import { useAuth } from "./hooks/useAuth";
import { useKeystrokeTiming } from "./hooks/useKeystrokeTiming";
import { usePasteDetection } from "./hooks/usePasteDetection";
import { useSessionLibrary } from "./hooks/useSessionLibrary";
import { useWritingSession } from "./hooks/useWritingSession";
import type { WritingSessionDetail } from "./types/session";

const App = () => {
  const [text, setText] = useState("");
  const [activeView, setActiveView] = useState<"editor" | "sessions">("editor");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const {
    auth,
    authMode,
    email,
    password,
    authError,
    authBusy,
    canSubmit,
    minPasswordLength,
    passwordHint,
    setEmail,
    setPassword,
    submitAuth,
    toggleMode,
    signOut
  } = useAuth();

  const sessionKey = auth.user ? `${auth.user.id}:${activeSessionId ?? "new"}` : null;
  const { timingSnapshot, handleKeyDown, handleKeyUp, formatMs } = useKeystrokeTiming(
    sessionKey
  );
  const { pasteSnapshot, handlePaste } = usePasteDetection(sessionKey);

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\s+/).length;
  }, [text]);

  const { saveStatus, primeSession, startNewSession } = useWritingSession({
    auth,
    text,
    wordCount,
    timingSnapshot,
    pasteSnapshot
  });

  const {
    sessions,
    selectedSession,
    selectedSessionId,
    loading: sessionsLoading,
    detailLoading,
    error: sessionsError,
    refresh: refreshSessions,
    selectSession,
    clearSelection
  } = useSessionLibrary(auth.token);

  useEffect(() => {
    if (activeView === "sessions" && auth.token) {
      refreshSessions();
    }
  }, [activeView, auth.token, refreshSessions]);

  useEffect(() => {
    if (!auth.user) {
      setActiveView("editor");
      setText("");
      setActiveSessionId(null);
    }
  }, [auth.user]);

  const handleOpenSession = (session: WritingSessionDetail) => {
    setText(session.content);
    setActiveSessionId(session.id);
    primeSession(session.id, {
      content: session.content,
      wordCount: session.wordCount,
      timingSummary: session.timingSummary,
      pasteSummary: session.pasteSummary
    });
    setActiveView("editor");
  };

  const handleStartNewSession = () => {
    setText("");
    setActiveSessionId(null);
    startNewSession();
    clearSelection();
    setActiveView("editor");
  };

  const saveLabel = useMemo(() => {
    if (!auth.user) {
      return "";
    }
    if (!text.trim()) {
      return "Waiting for input";
    }
    if (saveStatus === "saving") {
      return "Saving...";
    }
    if (saveStatus === "saved") {
      return "Saved";
    }
    if (saveStatus === "error") {
      return "Save failed";
    }
    return "Not saved";
  }, [auth.user, saveStatus, text]);

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Authentic writing workspace</p>
          <h1>Vi-Notes</h1>
          <p className="app__subtitle">Write freely. We will handle the proof.</p>
        </div>
        <div className="app__controls">
          <div className="app__stats">
            <span>{wordCount} words</span>
            <span className="app__divider" />
            <span className="app__auth-status">
              {auth.user ? `Signed in as ${auth.user.email}` : "Sign in"}
            </span>
          </div>
          {auth.user ? (
            <div className="app__nav">
              <button
                className={`app__nav-button${activeView === "editor" ? " is-active" : ""}`}
                type="button"
                onClick={() => setActiveView("editor")}
              >
                Editor
              </button>
              <button
                className={`app__nav-button${activeView === "sessions" ? " is-active" : ""}`}
                type="button"
                onClick={() => setActiveView("sessions")}
              >
                My Sessions
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <main className="app__main">
        {auth.user ? (
          activeView === "editor" ? (
            <EditorPanel
              value={text}
              onChange={setText}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onPaste={handlePaste}
            />
          ) : (
            <SessionsPanel
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              selectedSession={selectedSession}
              loading={sessionsLoading}
              detailLoading={detailLoading}
              error={sessionsError}
              onRefresh={refreshSessions}
              onSelect={selectSession}
              onOpen={handleOpenSession}
              onStartNew={handleStartNewSession}
            />
          )
        ) : (
          <AuthPanel
            authMode={authMode}
            email={email}
            password={password}
            authError={authError}
            authBusy={authBusy}
            canSubmit={canSubmit}
            minPasswordLength={minPasswordLength}
            passwordHint={passwordHint}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={submitAuth}
            onToggleMode={toggleMode}
          />
        )}
      </main>
      <footer className="app__footer">
        {auth.user ? (
          <>
            {activeView === "editor" ? (
              <div className="app__metrics">
                <span>Keystrokes: {timingSnapshot.total}</span>
                <span className="app__divider" />
                <span>Avg hold: {formatMs(timingSnapshot.avgHoldMs)}</span>
                <span className="app__divider" />
                <span>Avg gap: {formatMs(timingSnapshot.avgGapMs)}</span>
                <span className="app__divider" />
                <span>Pastes: {pasteSnapshot.totalEvents}</span>
                <span className="app__divider" />
                <span>Paste chars: {pasteSnapshot.totalChars}</span>
                <span className="app__divider" />
                <span className="app__status" data-state={saveStatus}>
                  {saveLabel}
                </span>
              </div>
            ) : (
              <span className="app__hint">Browse saved sessions.</span>
            )}
            <button className="link" type="button" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <span>Sign in to start a verified writing session.</span>
        )}
      </footer>
    </div>
  );
};

export default App;
