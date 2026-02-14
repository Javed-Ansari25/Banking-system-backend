import jwt from "jsonwebtoken"
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/apiError.utils.js";
import { BlacklistedToken } from "../model/blacklistedToken.model.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    if (!incomingToken) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    // Blacklist Check
    const blacklisted = await BlacklistedToken.findOne({
      token: incomingToken,
    });

    if (blacklisted) {
      return next(new ApiError(401, "Token expired or logged out"));
    }

    const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded?._id);

    if (!user) {
      return next(new ApiError(401, "Invalid access token"));
    }

    req.user = user;
    req.token = incomingToken; // logout ke liye important

    next();

  } catch (error) {
    return next(new ApiError(401, error?.message || "Invalid access token"));
  }
};

export const systemVerifyJWT = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    if (!incomingToken) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    // Blacklist check
    const blacklisted = await BlacklistedToken.findOne({
      token: incomingToken,
    });

    if (blacklisted) {
      return next(new ApiError(401, "Token expired or logged out"));
    }

    const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded?._id).select("+systemUser");

    if (!user) {
      return next(new ApiError(401, "Invalid access token"));
    }

    if (!user.systemUser) {
      return next(new ApiError(403, "Access denied: Not a system user"));
    }

    req.user = user;
    req.token = incomingToken; // future logout/use ke liye

    return next();

  } catch (error) {
    return next(new ApiError(401, error?.message || "Invalid access token"));
  }
};
