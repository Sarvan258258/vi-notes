export type AuthMode = "login" | "register";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
};
