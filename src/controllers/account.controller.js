import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { Account } from "../model/account.model.js";

const createAccount = asyncHandler(async (req, res) => {
    const user = req?.user;

    const account = await Account.create({
        user : user._id
    })

    if (!account) {
        throw new ApiError(400, "Account not created");
    }

    return res.status(201).json(
        new ApiResponse(201, account, "Account created successfully")
    )
})

const getUserAccount = asyncHandler(async (req, res) => {
    const user = req?.user;
    const account = await Account.find({user : user._id});

    if (!account) {
        throw new ApiError(404, "Account not found");
    }
    return res.status(200).json(
        new ApiResponse(200, account, "Account fetched successfully")
    )
})

const getAccountBalance = asyncHandler(async (req, res) => {
    const {accountId} = req.params;

    const user = req?.user;
    const account = await Account.findOne({user : user._id, _id : accountId});
    if (!account) {
        throw new ApiError(404, "Account not found");
    }

    const balance = await account.getBalance();

    return res.status(200).json(
        new ApiResponse(200,{accountId: account._id, balance}, "Account balance fetched successfully")
    )
})

export {createAccount, getUserAccount, getAccountBalance}
