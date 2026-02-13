import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.utils.js";

const ledgerSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
      immutable: true
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true,
      immutable: true
    },

    entryType: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      required: true,
      immutable: true
    },

    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be greater than 0"],
      immutable: true
    },

  },
  {
    timestamps: true, 
  }
);

const preventLedgerModification = () => {
  throw new ApiError(403, "Ledger entries are immutable and cannot be modified or deleted");
};

ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], preventLedgerModification);
ledgerSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], preventLedgerModification);
ledgerSchema.index({ account: 1, createdAt: -1 });

export const Ledger = mongoose.model("Ledger", ledgerSchema);
