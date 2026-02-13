import { Router } from "express";
import {verifyJWT, systemVerifyJWT} from "../middlewares/auth.middleware.js";
import { createTransaction, createInitialFundsTransaction } from "../controllers/transaction.controller.js";

const router = Router();

// routes
router.route("/").post(verifyJWT, createTransaction)
router.route("/system/initial-funds").post(systemVerifyJWT, createInitialFundsTransaction)

export default router
