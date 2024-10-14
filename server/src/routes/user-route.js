import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
} from "../controllers/user-controller.js";
// import { verifyToken } from "../middlewares/auth-middleware.js";
import verifyToken from "../middlewares/auth-middleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/refresh-token", refreshToken);

export default router;
