"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.sendPasswordResetEmail = exports.verifyEmail = exports.refreshUserAccessToken = exports.loginUser = exports.createAccount = void 0;
const env_1 = require("../constants/env");
const http_1 = require("../constants/http");
const Date_1 = require("../utils/Date");
const jwt_1 = require("../utils/jwt");
const emailTemplates_1 = require("../utils/emailTemplates");
const session_model_1 = __importDefault(require("../models/session.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const verificationCode_model_1 = __importDefault(require("../models/verificationCode.model"));
const appAssert_1 = __importDefault(require("../utils/appAssert"));
const bcrypt_1 = require("../utils/bcrypt");
const sendMail_1 = require("../utils/sendMail");
const createAccount = async (data) => {
    //verify existing user doesn't exist
    const existingUser = await user_model_1.default.exists({
        email: data.email,
    });
    (0, appAssert_1.default)(!existingUser, http_1.CONFLICT, "Email already in use");
    //create user
    const user = await user_model_1.default.create({
        email: data.email,
        password: data.password,
    });
    //create verification code
    const userId = user._id;
    const verificationCode = await verificationCode_model_1.default.create({
        userId,
        type: "email_verification" /* VerificationCodeType.EmailVerification */,
        expiresAt: (0, Date_1.oneYearFromNow)(),
    });
    //TODO:
    //send verification email
    const url = `${env_1.APP_ORIGIN}/email/verify/${verificationCode._id}`;
    const { error } = await (0, sendMail_1.sendMail)({
        to: user.email,
        ...(0, emailTemplates_1.getVerifyEmailTemplate)(url),
    });
    if (error) {
        console.log(error);
    }
    //create session
    const session = await session_model_1.default.create({
        userId,
        userAgent: data.userAgent,
    });
    //refresh token
    const refreshToken = (0, jwt_1.signToken)({
        sessionId: session._id,
    }, jwt_1.refreshTokenSignOptions);
    //access token
    const accessToken = (0, jwt_1.signToken)({
        userId,
        sessionId: session._id,
    });
    //return user & tokens
    return {
        user: user.omitPassword(),
        refreshToken,
        accessToken,
    };
};
exports.createAccount = createAccount;
const loginUser = async ({ email, password, userAgent, }) => {
    //get the user by email
    const user = await user_model_1.default.findOne({ email });
    (0, appAssert_1.default)(user, http_1.UNAUTHORIZED, "Invalid Email or Password");
    //validate password from the request
    const isValid = await user.comparePassword(password);
    (0, appAssert_1.default)(isValid, http_1.UNAUTHORIZED, "Invalid Email or Password");
    const userId = user._id;
    //create a session
    const session = await session_model_1.default.create({
        userId,
        userAgent,
    });
    //sign access token & refresh token
    //refresh token
    const sessionInfo = {
        sessionId: session._id,
    };
    const refreshToken = (0, jwt_1.signToken)(sessionInfo, jwt_1.refreshTokenSignOptions);
    //access token
    const accessToken = (0, jwt_1.signToken)({
        ...sessionInfo,
        userId,
    });
    //return user & tokens
    return {
        user: user.omitPassword(),
        refreshToken,
        accessToken,
    };
    //return user & token
};
exports.loginUser = loginUser;
const refreshUserAccessToken = async (refreshToken) => {
    const { payload } = (0, jwt_1.verifyToken)(refreshToken, {
        secret: jwt_1.refreshTokenSignOptions.secret,
    });
    (0, appAssert_1.default)(payload, http_1.UNAUTHORIZED, "Invalid refresh token");
    const session = await session_model_1.default.findById(payload.sessionId);
    const now = Date.now();
    (0, appAssert_1.default)(session && session.expiresAt.getTime() > now, http_1.UNAUTHORIZED, "Session Expired");
    //seamless experience for users who are active on the platform
    //refresh the session if it expires within 24 hours
    const sessionNeedsRefresh = session.expiresAt.getTime() - now > Date_1.ONE_DAY_MS;
    if (sessionNeedsRefresh) {
        session.expiresAt = (0, Date_1.thirtyDaysFromNow)();
        await session.save();
    }
    const newRefreshToken = sessionNeedsRefresh
        ? (0, jwt_1.signToken)({
            sessionId: session,
        }, jwt_1.refreshTokenSignOptions)
        : undefined;
    const accessToken = (0, jwt_1.signToken)({
        userId: session.userId,
        sessionId: session._id,
    });
    return {
        accessToken,
        newRefreshToken
    };
};
exports.refreshUserAccessToken = refreshUserAccessToken;
const verifyEmail = async (code) => {
    //get the verification code
    const validCode = await verificationCode_model_1.default.findOne({
        _id: code,
        type: "email_verification" /* VerificationCodeType.EmailVerification */,
        expiresAt: { $gt: new Date() }
    });
    (0, appAssert_1.default)(validCode, http_1.NOT_FOUND, "Invalid or Expired verification code");
    //update user to verified true
    const updateUser = await user_model_1.default.findByIdAndUpdate(validCode.userId, // Pass the userId directly here
    {
        verified: true, // Update object
    }, { new: true } //return the updated document
    );
    (0, appAssert_1.default)(updateUser, http_1.INTERNAL_SERVER_ERROR, "Failed to verify email");
    //delete verification code
    await validCode.deleteOne();
    //return user
    return {
        user: updateUser.omitPassword()
    };
};
exports.verifyEmail = verifyEmail;
const sendPasswordResetEmail = async (email) => {
    //get the user by email
    const user = await user_model_1.default.findOne({ email });
    (0, appAssert_1.default)(user, http_1.NOT_FOUND, "User not found");
    //check email rate limit ---> WE DONT WANT THE USER INFINITE REQUESTS
    const fiveMinAgo = (0, Date_1.fiveMinutesAgo)();
    const count = await verificationCode_model_1.default.countDocuments({
        userId: user._id,
        type: "password_reset" /* VerificationCodeType.PasswordReset */,
        created: { $gt: fiveMinAgo },
    });
    (0, appAssert_1.default)(count <= 1, http_1.TOO_MANY_REQUESTS, "Too many requests, please try again later");
    //Create verification code
    const expiresAt = (0, Date_1.oneHourNow)();
    const verificationCode = await verificationCode_model_1.default.create({
        userId: user.id,
        type: "password_reset" /* VerificationCodeType.PasswordReset */,
        expiresAt,
    });
    //send verification mail
    const url = `${env_1.APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;
    const { data, error } = await (0, sendMail_1.sendMail)({
        to: user.email,
        ...(0, emailTemplates_1.getPasswordResetTemplate)(url),
    });
    (0, appAssert_1.default)(data?.id, http_1.INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);
    //return success
    return {
        url,
        emailId: data.id,
    };
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const resetPassword = async ({ password, verificationCode }) => {
    //get the verification code
    const validCode = await verificationCode_model_1.default.findOne({
        _id: verificationCode,
        type: "password_reset" /* VerificationCodeType.PasswordReset */,
        expiresAt: { $gt: new Date() },
    });
    (0, appAssert_1.default)(validCode, http_1.NOT_FOUND, "Invalid or Expired Verification Code");
    //update the users password if valid
    const updatedUser = await user_model_1.default.findByIdAndUpdate(validCode.userId, {
        password: await (0, bcrypt_1.hashValue)(password)
    });
    (0, appAssert_1.default)(updatedUser, http_1.INTERNAL_SERVER_ERROR, "Failed to reset password");
    //delete the verification code
    await validCode.deleteOne({
        userId: updatedUser._id
    });
    //delete all sessions of that user
    return {
        user: updatedUser.omitPassword(),
    };
};
exports.resetPassword = resetPassword;
