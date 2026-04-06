import type { NextFunction, Request, Response } from "express";
import type { WithId } from "mongodb";
import { getCollections, type UserDocument } from "../db/mongo.js";
import { getAuthToken } from "../utils/auth.js";

export type AuthenticatedRequest = Request & { user: WithId<UserDocument> };

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { sessionsCollection, usersCollection } = getCollections();
  const session = await sessionsCollection.findOne({ token });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const user = await usersCollection.findOne({ _id: session.userId });
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  (req as AuthenticatedRequest).user = user;
  return next();
};
