import type { AuthUser } from "../types/auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

type AuthPayload = {
  token: string;
  user: AuthUser;
};

type AuthResult =
  | { ok: true; data: AuthPayload }
  | { ok: false; error: string };

const requestAuth = async (
  path: string,
  email: string,
  password: string,
  fallbackError: string
): Promise<AuthResult> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = (await response.json().catch(() => ({}))) as {
    token?: string;
    user?: AuthUser;
    error?: string;
  };

  if (!response.ok || !data.token || !data.user) {
    return { ok: false, error: data.error ?? fallbackError };
  }

  return { ok: true, data: { token: data.token, user: data.user } };
};

export const loginUser = (email: string, password: string) =>
  requestAuth("/auth/login", email, password, "Unable to sign in.");

export const registerUser = (email: string, password: string) =>
  requestAuth("/auth/register", email, password, "Unable to register.");

export const logoutUser = async (token: string) => {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
};
