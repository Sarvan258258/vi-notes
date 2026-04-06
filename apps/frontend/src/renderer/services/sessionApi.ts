import type {
  WritingSessionDetail,
  WritingSessionPayload,
  WritingSessionSummary
} from "../types/session";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

type ApiErrorResponse = {
  error?: string;
};

type CreateSessionResponse = {
  id?: string;
  error?: string;
};

type ListSessionsResponse = {
  sessions?: WritingSessionSummary[];
  error?: string;
};

type GetSessionResponse = {
  session?: WritingSessionDetail;
  error?: string;
};

const parseJson = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
};

export const createWritingSession = async (token: string, payload: WritingSessionPayload) => {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await parseJson<CreateSessionResponse>(response);
  if (!response.ok || !data.id) {
    throw new Error(data.error ?? "Failed to create session.");
  }

  return data.id;
};

export const updateWritingSession = async (
  token: string,
  sessionId: string,
  payload: WritingSessionPayload
) => {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await parseJson<ApiErrorResponse>(response);
    throw new Error(data.error ?? "Failed to update session.");
  }
};

export const listWritingSessions = async (token: string) => {
  const response = await fetch(`${API_BASE}/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await parseJson<ListSessionsResponse>(response);
  if (!response.ok || !data.sessions) {
    throw new Error(data.error ?? "Failed to load sessions.");
  }

  return data.sessions;
};

export const getWritingSession = async (token: string, sessionId: string) => {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await parseJson<GetSessionResponse>(response);
  if (!response.ok || !data.session) {
    throw new Error(data.error ?? "Failed to load session.");
  }

  return data.session;
};
