import { User } from "../model/user.model.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { sendRegistrationEmail } from "../services/email.services.js";

const register = asyncHandler(async (req, res) => {
    const { email, password, fullName, mobile } = req.body;

    if (!email || !password || !fullName) {
        throw new ApiError(400, "All fields are required");
    }

    let user;
    try {
        user = await User.create({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password,
            mobile,
        });

    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, "User already exists with Email");
        }
        throw error;
    }

    res.status(201).json(
        new ApiResponse(201, 
        {
            _id: user._id,
            fullName: user.fullName,
            email: user.email
        }, 
        "User registered successfully")
    );  

    // sent email
    await sendRegistrationEmail({
        email: user.email,
        fullName: user.fullName,
    }).catch(err => {
        console.error("Registration email failed:", err.message);
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    const token = user.generateToken();
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json(
        new ApiResponse(
            200,
            {
                _id: user._id,
                email: user.email,
                fullName: user.fullName
             },
             "User logged in successfully"
        )
    )
});

const logout = asyncHandler(async (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
        .status(200)
        .clearCookie("token", cookieOptions)
        .json(
            new ApiResponse(200, {}, "User logout successfully")
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    )
})

export {register, login, logout, getCurrentUser}
