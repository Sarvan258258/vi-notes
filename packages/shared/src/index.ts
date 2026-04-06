export type SessionId = string;

export type WritingSession = {
  id: SessionId;
  userId: string;
  startedAt: string;
  content: string;
};
