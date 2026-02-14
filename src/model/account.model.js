import mongoose from "mongoose";
import { Ledger } from "./ledger.model.js";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["USER", "SYSTEM"],
      default: "USER"
   },

    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN", "CLOSED"],
      default: "ACTIVE",
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
      trim: true,
    },
  },
  {
    timestamps: true, 
  }
);

accountSchema.methods.getBalance = async function () {
  const balanceData = await Ledger.aggregate([
    {
      $match: { account: this._id }
    },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [
              { $eq: ["$entryType", "DEBIT"] },
              "$amount",
              0
            ]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [
              { $eq: ["$entryType", "CREDIT"] },
              "$amount",
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        balance: {
          $subtract: ["$totalCredit", "$totalDebit"] // FIXED
        }
      }
    }
  ]);

  if (balanceData.length === 0) return 0;

  return balanceData[0].balance;
};

accountSchema.index({user:1 ,status:1})

export const Account = mongoose.model("Account", accountSchema);
