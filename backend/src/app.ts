import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import writingSessionRoutes from "./routes/writingSessionRoutes.js";

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: "*" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/sessions", writingSessionRoutes);

  return app;
};
