import { APP_ORIGIN, JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constants/http";
import { ONE_DAY_MS, fiveMinutesAgo, oneHourNow, oneYearFromNow, thirtyDaysFromNow } from "../utils/Date";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../utils/emailTemplates";

import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import VerificationCodeType from "../constants/verificationCodeType";
import appAssert from "../utils/appAssert";
import { hashValue } from "../utils/bcrypt";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/sendMail";

export type CreateAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const createAccount = async (data: CreateAccountParams) => {
  //verify existing user doesn't exist
  const existingUser = await UserModel.exists({
    email: data.email,
  });

  appAssert(!existingUser, CONFLICT, "Email already in use");

  //create user

  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  //create verification code
  const userId = user._id;
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });

  //TODO:
  //send verification email

  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;
  const { error } = 
  await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  if(error){
    console.log(error)
  }

  //create session
  const session = await SessionModel.create({
    userId,
    userAgent: data.userAgent,
  });
  //refresh token
  const refreshToken = signToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions
  );
  //access token
  const accessToken = signToken({
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

export type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  //get the user by email
  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Invalid Email or Password");

  //validate password from the request
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid Email or Password");

  const userId = user._id;
  //create a session
  const session = await SessionModel.create({
    userId,
    userAgent,
  });

  //sign access token & refresh token
  //refresh token

  const sessionInfo = {
    sessionId: session._id,
  };

  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
  //access token

  const accessToken = signToken({
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

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(
    session && session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    "Session Expired"
  );

  //seamless experience for users who are active on the platform

  //refresh the session if it expires within 24 hours

  const sessionNeedsRefresh = session.expiresAt.getTime() - now > ONE_DAY_MS;

  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session,
        },
        refreshTokenSignOptions
      )
    : undefined;

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return{
    accessToken,
    newRefreshToken
  }
};


export const verifyEmail = async(code: string) =>{
  //get the verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: {$gt: new Date() }
  })

  appAssert(validCode, NOT_FOUND, "Invalid or Expired verification code");

  //update user to verified true
  const updateUser = await UserModel.findByIdAndUpdate(
    validCode.userId, // Pass the userId directly here
    {
      verified: true, // Update object
    },
    { new: true } //return the updated document
  );

  appAssert(updateUser, INTERNAL_SERVER_ERROR, "Failed to verify email");
  
  //delete verification code
  await validCode.deleteOne();


  //return user
  return {
    user: updateUser.omitPassword()
  }
}


export const sendPasswordResetEmail = async(email: string) => {

  //get the user by email
  const user = await UserModel.findOne({email});
  appAssert(user, NOT_FOUND, "User not found");

  //check email rate limit ---> WE DONT WANT THE USER INFINITE REQUESTS
  const fiveMinAgo = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    userId: user._id,
    type: VerificationCodeType.PasswordReset,
    created: { $gt: fiveMinAgo },
  })

  appAssert(count<=1, TOO_MANY_REQUESTS, "Too many requests, please try again later");

  //Create verification code
  const expiresAt = oneHourNow();
  const verificationCode = await VerificationCodeModel.create({
    userId: user.id,
    type: VerificationCodeType.PasswordReset,
    expiresAt,
  })

  //send verification mail
  const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;

  const { data, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  })

  appAssert(
    data?.id,
    INTERNAL_SERVER_ERROR,
    `${error?.name} - ${error?.message}`
  )
  //return success

  return{
    url,
    emailId: data.id,
  }
}

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
}

export const resetPassword = async(
  {password, verificationCode} : ResetPasswordParams
) => {
  //get the verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: 
    { $gt: new Date() },
  })

  appAssert(validCode, NOT_FOUND, "Invalid or Expired Verification Code");


  //update the users password if valid

  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      password: await hashValue(password)
      
    }
  )

  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");


  //delete the verification code
  await validCode.deleteOne({
    userId: updatedUser._id
  })

  //delete all sessions of that user
  return{
    user: updatedUser.omitPassword(),
  }
}