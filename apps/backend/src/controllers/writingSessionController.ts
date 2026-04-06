import type { RequestHandler, Response } from "express";
import { ObjectId, WithId } from "mongodb";
import { getCollections, type WritingSessionDocument } from "../db/mongo.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

type TimingSummary = {
  totalKeystrokes: number;
  avgHoldMs: number | null;
  avgGapMs: number | null;
};

type PasteSummary = {
  totalEvents: number;
  totalChars: number;
};

type WritingSessionPayload = {
  content: string;
  wordCount: number;
  timingSummary: TimingSummary;
  pasteSummary: PasteSummary;
};

type ParseResult = { value: WritingSessionPayload } | { error: string };

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isNumber(value);

const parsePayload = (body: unknown): ParseResult => {
  if (!body || typeof body !== "object") {
    return { error: "Session payload is required." };
  }
  const payload = body as Partial<WritingSessionPayload>;

  const content = payload.content;
  if (typeof content !== "string") {
    return { error: "Content is required." };
  }
  const wordCount = payload.wordCount;
  if (!isNumber(wordCount)) {
    return { error: "Word count is required." };
  }
  if (!payload.timingSummary || typeof payload.timingSummary !== "object") {
    return { error: "Timing summary is required." };
  }
  if (!payload.pasteSummary || typeof payload.pasteSummary !== "object") {
    return { error: "Paste summary is required." };
  }

  const timingSummary = payload.timingSummary as Partial<TimingSummary>;
  const totalKeystrokes = timingSummary.totalKeystrokes;
  if (!isNumber(totalKeystrokes)) {
    return { error: "Timing total is required." };
  }
  const avgHoldMs = timingSummary.avgHoldMs ?? null;
  if (!isNullableNumber(avgHoldMs)) {
    return { error: "Timing average hold must be a number or null." };
  }
  const avgGapMs = timingSummary.avgGapMs ?? null;
  if (!isNullableNumber(avgGapMs)) {
    return { error: "Timing average gap must be a number or null." };
  }

  const pasteSummary = payload.pasteSummary as Partial<PasteSummary>;
  const totalEvents = pasteSummary.totalEvents;
  if (!isNumber(totalEvents)) {
    return { error: "Paste total events is required." };
  }
  const totalChars = pasteSummary.totalChars;
  if (!isNumber(totalChars)) {
    return { error: "Paste total chars is required." };
  }

  return {
    value: {
      content,
      wordCount,
      timingSummary: {
        totalKeystrokes,
        avgHoldMs,
        avgGapMs
      },
      pasteSummary: {
        totalEvents,
        totalChars
      }
    }
  };
};

const toSessionResponse = (session: WithId<WritingSessionDocument>) => ({
  id: session._id.toHexString(),
  content: session.content,
  wordCount: session.wordCount,
  timingSummary: session.timingSummary,
  pasteSummary: session.pasteSummary,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  revisionCount: session.revisionCount ?? 1,
  saveHistory: session.saveHistory ?? []
});

export const createWritingSession: RequestHandler = async (req, res) => {
  const authedReq = req as AuthenticatedRequest;
  const parsed = parsePayload(req.body);
  if ("error" in parsed) {
    return res.status(400).json({ error: parsed.error });
  }

  const { writingSessionsCollection } = getCollections();
  const now = new Date().toISOString();
  const document: WritingSessionDocument = {
    userId: authedReq.user._id,
    content: parsed.value.content,
    wordCount: parsed.value.wordCount,
    timingSummary: parsed.value.timingSummary,
    pasteSummary: parsed.value.pasteSummary,
    createdAt: now,
    updatedAt: now,
    revisionCount: 1,
    saveHistory: [now]
  };

  const result = await writingSessionsCollection.insertOne(document);
  return res
    .status(201)
    .json({ id: result.insertedId.toHexString(), createdAt: now, updatedAt: now });
};

export const updateWritingSession: RequestHandler = async (req, res) => {
  const authedReq = req as AuthenticatedRequest;
  const sessionId = req.params.id;
  if (!ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const parsed = parsePayload(req.body);
  if ("error" in parsed) {
    return res.status(400).json({ error: parsed.error });
  }

  const { writingSessionsCollection } = getCollections();
  const updatedAt = new Date().toISOString();
  const result = await writingSessionsCollection.updateOne(
    { _id: new ObjectId(sessionId), userId: authedReq.user._id },
    {
      $set: {
        content: parsed.value.content,
        wordCount: parsed.value.wordCount,
        timingSummary: parsed.value.timingSummary,
        pasteSummary: parsed.value.pasteSummary,
        updatedAt
      },
      $inc: {
        revisionCount: 1
      },
      $push: {
        saveHistory: {
          $each: [updatedAt],
          $slice: -50
        }
      }
    }
  );

  if (!result.matchedCount) {
    return res.status(404).json({ error: "Session not found." });
  }

  return res.json({ id: sessionId, updatedAt });
};

export const listWritingSessions: RequestHandler = async (req, res) => {
  const authedReq = req as AuthenticatedRequest;
  const { writingSessionsCollection } = getCollections();
  const sessions = await writingSessionsCollection
    .find({ userId: authedReq.user._id })
    .sort({ updatedAt: -1 })
    .limit(20)
    .toArray();

  return res.json({
    sessions: sessions.map((session) => ({
      id: session._id.toHexString(),
      wordCount: session.wordCount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      revisionCount: session.revisionCount ?? 1
    }))
  });
};

export const getWritingSession: RequestHandler = async (req, res) => {
  const authedReq = req as AuthenticatedRequest;
  const sessionId = req.params.id;
  if (!ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const { writingSessionsCollection } = getCollections();
  const session = await writingSessionsCollection.findOne({
    _id: new ObjectId(sessionId),
    userId: authedReq.user._id
  });

  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  return res.json({ session: toSessionResponse(session) });
};
