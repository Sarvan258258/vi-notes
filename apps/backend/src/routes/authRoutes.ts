import { Router } from "express";
import { getMe, loginUser, logoutUser, registerUser } from "../controllers/authController.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", getMe);
router.post("/logout", logoutUser);

export default router;
