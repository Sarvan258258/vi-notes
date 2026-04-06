import crypto from "node:crypto";
import type { Request } from "express";
import type { ObjectId } from "mongodb";
import { getCollections } from "../db/mongo.js";

export const createSession = async (userId: ObjectId) => {
  const { sessionsCollection } = getCollections();
  const token = crypto.randomUUID();
  await sessionsCollection.insertOne({
    token,
    userId,
    createdAt: new Date().toISOString()
  });
  return token;
};

export const getAuthToken = (req: Request) => {
  const header = req.header("authorization");
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
};
