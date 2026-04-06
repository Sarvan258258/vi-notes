import { useEffect, useMemo, useState } from "react";
import type { AuthMode, AuthState } from "../types/auth";
import { loginUser, logoutUser, registerUser } from "../services/authApi";

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
const MIN_PASSWORD_LENGTH = 10;

const getPasswordHint = (mode: AuthMode) =>
  mode === "register"
    ? "At least 10 chars, with uppercase, lowercase, number, symbol."
    : "Enter your password.";

export const useAuth = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [auth, setAuth] = useState<AuthState>({ user: null, token: null });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("viNotesAuth");
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthState;
      if (parsed?.token && parsed?.user) {
        setAuth(parsed);
      }
    } catch {
      window.localStorage.removeItem("viNotesAuth");
    }
  }, []);

  useEffect(() => {
    if (auth.user && auth.token) {
      window.localStorage.setItem("viNotesAuth", JSON.stringify(auth));
    } else {
      window.localStorage.removeItem("viNotesAuth");
    }
  }, [auth]);

  const isStrongPassword = useMemo(() => strongPasswordPattern.test(password), [password]);
  const canSubmit = useMemo(() => {
    if (!email.trim()) {
      return false;
    }
    return authMode === "login" ? password.length > 0 : isStrongPassword;
  }, [authMode, email, isStrongPassword, password]);

  const minPasswordLength = authMode === "register" ? MIN_PASSWORD_LENGTH : 1;
  const passwordHint = getPasswordHint(authMode);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (authError) {
      setAuthError(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (authError) {
      setAuthError(null);
    }
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || authBusy) {
      return;
    }

    setAuthBusy(true);
    setAuthError(null);

    try {
      const result =
        authMode === "login"
          ? await loginUser(email, password)
          : await registerUser(email, password);

      if (!result.ok) {
        setAuthError(result.error);
        return;
      }

      setAuth({ token: result.data.token, user: result.data.user });
      setPassword("");
    } catch {
      setAuthError("Unable to reach the server.");
    } finally {
      setAuthBusy(false);
    }
  };

  const toggleMode = () => {
    setAuthMode((current) => (current === "login" ? "register" : "login"));
    setAuthError(null);
  };

  const signOut = async () => {
    const token = auth.token;
    setAuth({ token: null, user: null });
    if (!token) {
      return;
    }
    try {
      await logoutUser(token);
    } catch {
      // Ignore logout errors for now.
    }
  };

  return {
    auth,
    authMode,
    email,
    password,
    authError,
    authBusy,
    canSubmit,
    minPasswordLength,
    passwordHint,
    setEmail: handleEmailChange,
    setPassword: handlePasswordChange,
    submitAuth,
    toggleMode,
    signOut
  };
};
