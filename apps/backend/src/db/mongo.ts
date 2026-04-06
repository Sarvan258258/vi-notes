import { Collection, MongoClient, ObjectId } from "mongodb";

export type UserDocument = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionDocument = {
  token: string;
  userId: ObjectId;
  createdAt: string;
};

export type WritingSessionDocument = {
  userId: ObjectId;
  content: string;
  wordCount: number;
  timingSummary: {
    totalKeystrokes: number;
    avgHoldMs: number | null;
    avgGapMs: number | null;
  };
  pasteSummary: {
    totalEvents: number;
    totalChars: number;
  };
  createdAt: string;
  updatedAt: string;
  revisionCount?: number;
  saveHistory?: string[];
};

let usersCollection: Collection<UserDocument> | null = null;
let sessionsCollection: Collection<SessionDocument> | null = null;
let writingSessionsCollection: Collection<WritingSessionDocument> | null = null;
let client: MongoClient | null = null;

export const connectToMongo = async (uri: string) => {
  client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  usersCollection = db.collection<UserDocument>("users");
  sessionsCollection = db.collection<SessionDocument>("sessions");
  writingSessionsCollection = db.collection<WritingSessionDocument>("writingSessions");

  await usersCollection.createIndex({ email: 1 }, { unique: true });
  await sessionsCollection.createIndex({ token: 1 }, { unique: true });
  await writingSessionsCollection.createIndex({ userId: 1, updatedAt: -1 });
};

export const getCollections = () => {
  if (!usersCollection || !sessionsCollection || !writingSessionsCollection) {
    throw new Error("MongoDB collections not initialized");
  }
  return { usersCollection, sessionsCollection, writingSessionsCollection };
};
