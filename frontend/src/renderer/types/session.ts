export type TimingSummary = {
  totalKeystrokes: number;
  avgHoldMs: number | null;
  avgGapMs: number | null;
};

export type PasteSummary = {
  totalEvents: number;
  totalChars: number;
};

export type WritingSessionPayload = {
  content: string;
  wordCount: number;
  timingSummary: TimingSummary;
  pasteSummary: PasteSummary;
};

export type WritingSessionSummary = {
  id: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  revisionCount: number;
};

export type WritingSessionDetail = WritingSessionPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
  revisionCount: number;
  saveHistory: string[];
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";
