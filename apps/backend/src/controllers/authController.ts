import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import type { WithId } from "mongodb";
import { getCollections, type UserDocument } from "../db/mongo.js";
import { createSession, getAuthToken } from "../utils/auth.js";
import {
  getPasswordValidationError,
  isValidEmail,
  normalizeEmail
} from "../utils/validation.js";

const toUserResponse = (user: WithId<UserDocument>) => ({
  id: user._id.toHexString(),
  email: user.email
});

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const { usersCollection } = getCollections();
  const existing = await usersCollection.findOne({ email: normalized });
  if (existing) {
    return res.status(409).json({ error: "Email is already registered." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userDoc: UserDocument = {
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  try {
    const result = await usersCollection.insertOne(userDoc);
    const user: WithId<UserDocument> = { ...userDoc, _id: result.insertedId };
    const token = await createSession(user._id);
    return res.status(201).json({ token, user: toUserResponse(user) });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: number }).code
        : undefined;
    if (code === 11000) {
      return res.status(409).json({ error: "Email is already registered." });
    }
    console.error("Failed to register user", error);
    return res.status(500).json({ error: "Failed to register user." });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalized = normalizeEmail(email);
  const { usersCollection } = getCollections();
  const user = await usersCollection.findOne({ email: normalized });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  try {
    const token = await createSession(user._id);
    return res.json({ token, user: toUserResponse(user) });
  } catch (error) {
    console.error("Failed to create session", error);
    return res.status(500).json({ error: "Failed to create session." });
  }
};

export const getMe = async (req: Request, res: Response) => {
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

  return res.json({ user: toUserResponse(user) });
};

export const logoutUser = async (req: Request, res: Response) => {
  const token = getAuthToken(req);
  if (token) {
    const { sessionsCollection } = getCollections();
    await sessionsCollection.deleteOne({ token });
  }
  return res.json({ status: "ok" });
};
