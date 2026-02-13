import { Transaction } from "../model/transaction.model.js";
import { Account } from "../model/account.model.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { Ledger } from "../model/ledger.model.js";
import { sendTransactionEmail } from "../services/email.services.js";
import mongoose from "mongoose";

const createTransaction = asyncHandler(async (req, res) => {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields are required");
    }

    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    if (fromAccount === toAccount) {
        throw new ApiError(400, "Cannot transfer to same account");
    }

    const fromUserAccount = await Account.findById(fromAccount);
    const toUserAccount = await Account.findById(toAccount);

    if (!fromUserAccount || !toUserAccount) {
        throw new ApiError(400, "Invalid account provided");
    }

    // 🔐 Ownership check
    if (fromUserAccount.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to transfer from this account");
    }

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Both accounts must be ACTIVE");
    }

    const existingTransaction = await Transaction.findOne({ idempotencyKey });

    if (existingTransaction) {
        return res.status(200).json(
            new ApiResponse(200, { transaction: existingTransaction }, "Transaction already processed")
        );
    }

    const balance = await fromUserAccount.getBalance();
    if (balance < amount) {
        throw new ApiError(400, `Insufficient balance. Current balance: ${balance}`);
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const [transaction] = await Transaction.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        await Ledger.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            entryType: "CREDIT"
        }], { session });

        await Ledger.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            entryType: "DEBIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        await sendTransactionEmail({
            email: req.user.email,
            fullName: req.user.fullName,
            amount,
            toAccount
        });

        return res.status(201).json(
            new ApiResponse(201, { transaction }, "Transaction completed successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

const createInitialFundsTransaction = asyncHandler(async (req, res) => {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields are required");
    }

    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    const existingTransaction = await Transaction.findOne({ idempotencyKey });

    if (existingTransaction) {
        return res.status(200).json(
            new ApiResponse(200, { transaction: existingTransaction }, "Transaction already processed")
        );
    }

    const toUserAccount = await Account.findById(toAccount);
    if (!toUserAccount) {
        throw new ApiError(400, "Invalid toAccount");
    }

    if (toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Account must be ACTIVE");
    }

    const systemAccount = await Account.findOne({ type: "SYSTEM" });

    if (!systemAccount) {
        throw new ApiError(500, "System account not found");
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const [transaction] = await Transaction.create([{
            fromAccount: systemAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        await Ledger.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            entryType: "CREDIT"
        }], { session });

        await Ledger.create([{
            account: systemAccount._id,
            amount,
            transaction: transaction._id,
            entryType: "DEBIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json(
            new ApiResponse(201, { transaction }, "Initial funds added successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

export {createTransaction, createInitialFundsTransaction}
