import { Router } from "express";
import { register, login, logout, getCurrentUser } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout)
router.route("/user").get(verifyJWT, getCurrentUser)

export default router
