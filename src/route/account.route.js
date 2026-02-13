import { Router } from "express";
import { createAccount, getUserAccount,getAccountBalance } from "../controllers/account.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

// routes
router.route("/create").post(createAccount);
router.route("/allAccount").get(getUserAccount);
router.route("/balance/:accountId").get(getAccountBalance);

export default router
