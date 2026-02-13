import express from "express";
import cookieParser from "cookie-parser";
import cors from "cookie-parser"
import compression from "compression";

const app = express();
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({extended: true, limit: "5mb"}));
app.use(cookieParser());
app.use(express.static("public"));

// import route 
import authRouter from "./route/auth.route.js"
import accountRoute from "./route/account.route.js"
import transactionRouter from "./route/transaction.route.js"

// routes define
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/account", accountRoute);
app.use("/api/v1/transaction", transactionRouter);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
});

export default app
