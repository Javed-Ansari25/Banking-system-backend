import { Transaction } from "../model/transaction.model.js";
import { Account } from "../model/account.model.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { Ledger } from "../model/ledger.model.js";
import { sendTransactionEmail, sendCreditEmail } from "../services/email.services.js";
import mongoose from "mongoose";

const createTransaction = asyncHandler(async (req, res) => {
    // 1. Extract required fields from request body and validate
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields are required");
    }

    // 2. Validate amount is greater than 0
    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    // 3. Prevent self transfer
    if (fromAccount === toAccount) {
        throw new ApiError(400, "Cannot transfer to same account");
    }

    // 4. Fetch sender and receiver accounts from database And validate they exist
    const fromUserAccount = await Account.findById(fromAccount);
    const toUserAccount = await Account.findById(toAccount);

    if (!fromUserAccount || !toUserAccount) {
        throw new ApiError(400, "Invalid account provided");
    }

    // 5. Verify logged-in user owns the sender account
    if (fromUserAccount.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to transfer from this account");
    }

    // 6. Ensure both accounts are ACTIVE
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Both accounts must be ACTIVE");
    }

    // 7. Check idempotency to prevent duplicate transactions And validation of idempotencyKey
    const existingTransaction = await Transaction.findOne({ idempotencyKey });
    if (existingTransaction) {
        return res.status(200).json(
            new ApiResponse(200, { transaction: existingTransaction }, "Transaction already processed")
        );
    }

    // 8. Get current balance of sender
    const balance = await fromUserAccount.getBalance();

    // 9. Check sufficient balance
    if (balance < amount) {
        throw new ApiError(400, `Insufficient balance. Current balance: ${balance}`);
    }

    // 10. Start MongoDB session
    const session = await mongoose.startSession();
    try {
        // 11. Start database transaction
        session.startTransaction();

        // 12. Create transaction document with PENDING status
        const [transaction] = await Transaction.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        // 13. Create CREDIT ledger entry for receiver
        await Ledger.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            entryType: "CREDIT"
        }], { session });

        // 14. Create DEBIT ledger entry for sender
        await Ledger.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            entryType: "DEBIT"
        }], { session });

        // 15. Update transaction status to COMPLETED
        transaction.status = "COMPLETED";
        await transaction.save({ session });

        // 16. Commit database transaction And End session
        await session.commitTransaction();
        session.endSession();

        // 17. Send transaction email to sender
        await sendTransactionEmail({
            email: req.user.email,
            fullName: req.user.fullName,
            amount,
            toAccount
        });

        // 18. Return success response
        return res.status(201).json(
            new ApiResponse(201, { transaction }, "Transaction completed successfully")
        );
    } catch (error) {
        // 19. Abort transaction if error occurs And End session
        await session.abortTransaction();
        session.endSession();
        throw error;  // Throw error to global error handler
    }
});

const createInitialFundsTransaction = asyncHandler(async (req, res) => {
    // 1. Extract required fields from request body and validate
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields are required");
    }

    // 2. Validate amount is greater than 0
    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    // 3. Check idempotency to prevent duplicate transactions and validation of idempotencyKey
    const existingTransaction = await Transaction.findOne({ idempotencyKey });
    if (existingTransaction) {
        return res.status(200).json(
            new ApiResponse(200, { transaction: existingTransaction }, "Transaction already processed")
        );
    }

    // 4. Fetch receiver account from database and validate it exists
    const toUserAccount = await Account.findById(toAccount);
    if (!toUserAccount) {
        throw new ApiError(400, "Invalid toAccount");
    }

    // 5. Ensure receiver account is ACTIVE
    if (toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Account must be ACTIVE");
    }

    // 6. Fetch SYSTEM account and validate it exists
    const systemAccount = await Account.findOne({ type: "SYSTEM" });
    if (!systemAccount) {
        throw new ApiError(500, "System account not found");
    }

    // 7. Start MongoDB session
    const session = await mongoose.startSession();
    try {
        // 8. Start database transaction
        session.startTransaction();

        // 9. Create transaction document (SYSTEM → User)
        const [transaction] = await Transaction.create([{
            fromAccount: systemAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        // 10. Create CREDIT ledger entry for user
        await Ledger.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            entryType: "CREDIT"
        }], { session });

        // 11. Create DEBIT ledger entry for SYSTEM account
        await Ledger.create([{
            account: systemAccount._id,
            amount,
            transaction: transaction._id,
            entryType: "DEBIT"
        }], { session });

        // 12. Update transaction status to COMPLETED
        transaction.status = "COMPLETED";
        await transaction.save({ session });

        // 13. Commit database transaction And End session
        await session.commitTransaction();
        session.endSession();

        // 14. Fetch user details for sending credit email to user
        const toUser = await User.findById(toUserAccount.user);
        await sendCreditEmail({
            email: toUser.email,
            fullName: toUser.fullName,
            amount,
            transactionId: transaction._id
        });

        // 15. Return success response
        return res.status(201).json(
            new ApiResponse(201, { transaction }, "Initial funds added successfully")
        );
    } catch (error) {
        // 16. Abort transaction if error occurs and End session
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

export {createTransaction, createInitialFundsTransaction}
