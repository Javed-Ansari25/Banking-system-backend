import mongoose from "mongoose";

const blacklistedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

// TTL index – token auto delete ho jayega jab expire ho jaye
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BlacklistedToken = mongoose.model("BlacklistedToken", blacklistedTokenSchema);
