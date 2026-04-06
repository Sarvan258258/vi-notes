import React from "react";
import type { AuthMode } from "../types/auth";

type AuthPanelProps = {
  authMode: AuthMode;
  email: string;
  password: string;
  authError: string | null;
  authBusy: boolean;
  canSubmit: boolean;
  minPasswordLength: number;
  passwordHint: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleMode: () => void;
};

const AuthPanel = ({
  authMode,
  email,
  password,
  authError,
  authBusy,
  canSubmit,
  minPasswordLength,
  passwordHint,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode
}: AuthPanelProps) => (
  <div className="auth">
    <div className="auth__copy">
      <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
      <p>
        Sign in to associate your writing sessions with your account and keep your
        authenticity record organized.
      </p>
    </div>
    <form className="auth__form" onSubmit={onSubmit}>
      <label className="auth__field">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label className="auth__field">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete={authMode === "login" ? "current-password" : "new-password"}
          minLength={minPasswordLength}
          required
        />
        <span className="auth__hint">{passwordHint}</span>
      </label>
      {authError ? <p className="auth__error">{authError}</p> : null}
      <button className="auth__button" type="submit" disabled={!canSubmit || authBusy}>
        {authBusy ? "Working..." : authMode === "login" ? "Sign in" : "Create account"}
      </button>
      <button className="auth__toggle" type="button" onClick={onToggleMode}>
        {authMode === "login"
          ? "Need an account? Register"
          : "Already have an account? Sign in"}
      </button>
    </form>
  </div>
);

export default AuthPanel;
