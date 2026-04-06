import { Router } from "express";
import {
  createWritingSession,
  getWritingSession,
  listWritingSessions,
  updateWritingSession
} from "../controllers/writingSessionController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listWritingSessions);
router.get("/:id", getWritingSession);
router.post("/", createWritingSession);
router.put("/:id", updateWritingSession);

export default router;
