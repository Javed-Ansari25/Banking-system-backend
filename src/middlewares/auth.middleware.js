import jwt from "jsonwebtoken"
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/apiError.utils.js";

export const verifyJWT = async (req, res, next) => {
    try {
        const incomingToken = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
        if(!incomingToken) {
            throw new ApiError(401, "UnAuthorization error");
        }

        const decode = jwt.verify(incomingToken, process.env.JWT_SECRET);
        const user = await User.findById(decode?._id);

        if(!user) {
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
}

export const systemVerifyJWT = async (req, res, next) => {
    try {
        const incomingToken = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", ""); 
        if(!incomingToken) {
            throw new ApiError(401, "UnAuthorization error");
        }

        const decode = jwt.verify(incomingToken, process.env.JWT_SECRET);
        const user = await User.findById(decode?._id).select("+systemUser");
        if(!user.systemUser) {
            throw new ApiError(401, "Invalid , not a system user");
        } 

        req.user = user;
        return next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
}

