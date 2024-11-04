import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";

import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import VerificationCodeType from "../constants/verificationCodeType";
import appAssert from "../utils/appAssert";
import jwt from "jsonwebtoken";
import { oneYearFromNow } from "../utils/Date";

export type CreateAccountParams = {
    email:string;
    password: string;
    userAgent?: string;
}

export const createAccount = async(data: CreateAccountParams) => {
    //verify existing user doesn't exist
    const existingUser = await UserModel.exists({
        email: data.email
    })

    appAssert(
        !existingUser, CONFLICT, "Email already in use"
    )
    // if(existingUser){
    //     throw new Error("User already exists.");
    // }


    //create user

    const user = await UserModel.create({
        email: data.email,
        password: data.password,
    })


    //create verification code
    const verifcationCode = await VerificationCodeModel.create({
        userId: user._id,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow()
    })

    //TODO:
    //send verification email


    //create session
    const session = await SessionModel.create({
        userId: user._id,
        userAgent: data.userAgent,

    });
    //refresh token
    const refreshToken = jwt.sign(
        {
            sessionId: session._id,
        },
        JWT_REFRESH_SECRET, {
            audience: ['user'],
            expiresIn: "30d",
        }
    )
    //access token
    const accessToken = jwt.sign(
        {
            sessionId: session._id,
        },
        JWT_SECRET, {
            audience: ['user'],
            expiresIn: "15m",
        }
    )
    //return user & tokens

    return {
        user: user.omitPassword(),
        refreshToken,
        accessToken,
    };
};

export type LoginParams = {
    email:string;
    password: string;
    userAgent?: string;
}

export const loginUser = async ({email, password, userAgent}: LoginParams)=>{
    //get the user by email
    const user = await UserModel.findOne({email});
    appAssert(user, UNAUTHORIZED, "Invalid Email or Password");
    
    
    
    //validate password from the request
    const isValid = await user.comparePassword(password);
    appAssert(isValid, UNAUTHORIZED, "Invalid Email or Password")


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
    }
    const refreshToken = jwt.sign(
        sessionInfo,
        JWT_REFRESH_SECRET, {
            audience: ['user'],
            expiresIn: "30d",
        }
    )
    //access token
    const accessToken = jwt.sign(
        {
            ...sessionInfo,
            userId: user._id,
        },
        JWT_SECRET, {
            audience: ['user'],
            expiresIn: "15m",
        }
    )
    //return user & tokens

    return {
        user: user.omitPassword(),
        refreshToken,
        accessToken,
    };
    //return user & token
}
