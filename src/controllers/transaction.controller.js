import { Transaction } from "../model/transaction.model.js";
import { Account } from "../model/account.model.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { Ledger } from "../model/ledger.model.js";
import { sendTransactionEmail, sendCreditEmail } from "../services/email.services.js";
import mongoose from "mongoose";

const createTransaction = asyncHandler(async (req, res) => {

    // 1. Extract required fields from request body
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // 2. Validate required fields
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Validate amount is greater than 0
    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    // 4. Prevent self transfer
    if (fromAccount === toAccount) {
        throw new ApiError(400, "Cannot transfer to same account");
    }

    // 5. Fetch sender and receiver accounts from database
    const fromUserAccount = await Account.findById(fromAccount);
    const toUserAccount = await Account.findById(toAccount);

    // 6. Validate both accounts exist
    if (!fromUserAccount || !toUserAccount) {
        throw new ApiError(400, "Invalid account provided");
    }

    // 7. Verify logged-in user owns the sender account
    if (fromUserAccount.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to transfer from this account");
    }

    // 8. Ensure both accounts are ACTIVE
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Both accounts must be ACTIVE");
    }

    // 9. Check idempotency to prevent duplicate transactions
    const existingTransaction = await Transaction.findOne({ idempotencyKey });

    // 10. If transaction already exists, return existing response
    if (existingTransaction) {
        return res.status(200).json(
            new ApiResponse(200, { transaction: existingTransaction }, "Transaction already processed")
        );
    }

    // 11. Get current balance of sender
    const balance = await fromUserAccount.getBalance();

    // 12. Check sufficient balance
    if (balance < amount) {
        throw new ApiError(400, `Insufficient balance. Current balance: ${balance}`);
    }

    // 13. Start MongoDB session
    const session = await mongoose.startSession();

    try {

        // 14. Start database transaction
        session.startTransaction();

        // 15. Create transaction document with PENDING status
        const [transaction] = await Transaction.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        // 16. Create CREDIT ledger entry for receiver
        await Ledger.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            entryType: "CREDIT"
        }], { session });

        // 17. Create DEBIT ledger entry for sender
        await Ledger.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            entryType: "DEBIT"
        }], { session });

        // 18. Update transaction status to COMPLETED
        transaction.status = "COMPLETED";
        await transaction.save({ session });

        // 19. Commit database transaction
        await session.commitTransaction();

        // 20. End session
        session.endSession();

        // 21. Send transaction email to sender
        await sendTransactionEmail({
            email: req.user.email,
            fullName: req.user.fullName,
            amount,
            toAccount
        });

        // 22. Return success response
        return res.status(201).json(
            new ApiResponse(201, { transaction }, "Transaction completed successfully")
        );

    } catch (error) {

        // 23. Abort transaction if error occurs
        await session.abortTransaction();

        // 24. End session
        session.endSession();

        // 25. Throw error to global error handler
        throw error;
    }
});

const createInitialFundsTransaction = asyncHandler(async (req, res) => {

    // 1. Extract required fields from request body
    const { toAccount, amount, idempotencyKey } = req.body;

    // 2. Validate required fields
    if (!toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Validate amount is greater than 0
    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    // 4. Check idempotency to prevent duplicate transactions
    const existingTransaction = await Transaction.findOne({ idempotencyKey });

    // 5. If transaction already exists, return existing response
    if (existingTransaction) {
        return res.status(200).json(
            new ApiResponse(200, { transaction: existingTransaction }, "Transaction already processed")
        );
    }

    // 6. Fetch receiver account from database
    const toUserAccount = await Account.findById(toAccount);

    // 7. Validate receiver account exists
    if (!toUserAccount) {
        throw new ApiError(400, "Invalid toAccount");
    }

    // 8. Ensure receiver account is ACTIVE
    if (toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Account must be ACTIVE");
    }

    // 9. Fetch SYSTEM account
    const systemAccount = await Account.findOne({ type: "SYSTEM" });

    // 10. Validate SYSTEM account exists
    if (!systemAccount) {
        throw new ApiError(500, "System account not found");
    }

    // 11. Start MongoDB session
    const session = await mongoose.startSession();

    try {

        // 12. Start database transaction
        session.startTransaction();

        // 13. Create transaction document (SYSTEM → User)
        const [transaction] = await Transaction.create([{
            fromAccount: systemAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        // 14. Create CREDIT ledger entry for user
        await Ledger.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            entryType: "CREDIT"
        }], { session });

        // 15. Create DEBIT ledger entry for SYSTEM account
        await Ledger.create([{
            account: systemAccount._id,
            amount,
            transaction: transaction._id,
            entryType: "DEBIT"
        }], { session });

        // 16. Update transaction status to COMPLETED
        transaction.status = "COMPLETED";
        await transaction.save({ session });

        // 17. Commit database transaction
        await session.commitTransaction();

        // 18. End session
        session.endSession();

        // 19. Fetch user details for sending email
        const toUser = await User.findById(toUserAccount.user);

        // 20. Send credit email to user
        await sendCreditEmail({
            email: toUser.email,
            fullName: toUser.fullName,
            amount,
            transactionId: transaction._id
        });

        // 21. Return success response
        return res.status(201).json(
            new ApiResponse(201, { transaction }, "Initial funds added successfully")
        );

    } catch (error) {

        // 22. Abort transaction if error occurs
        await session.abortTransaction();

        // 23. End session
        session.endSession();

        // 24. Throw error to global error handler
        throw error;
    }
});

export {createTransaction, createInitialFundsTransaction}
