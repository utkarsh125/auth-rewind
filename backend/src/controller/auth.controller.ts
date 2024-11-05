import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import { Request, Response } from "express";
import { clearAuthCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthCookies } from "../utils/cookies";
import { createAccount, loginUser, refreshUserAccessToken } from "../services/auth.service";
import { loginSchema, registerSchema } from "./auth.schemas";

import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { verifyToken } from "../utils/jwt";
import { z } from "zod";

export const registerHandler = catchErrors(async (req: Request, res: Response) => {
    // Validate request
    const request = registerSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    });

    // Respond with success message (example response)
    // return res.status(201).json({
    //     message: "User registered successfully",
    //     data: request,
    // });

    const{user, accessToken, refreshToken} = await createAccount(request);

    //return response
    return setAuthCookies({res, accessToken, refreshToken})
    .status(CREATED)
    .json(user)
});


export const loginHandler = catchErrors(async(req: Request, res: Response) => {
    const request = loginSchema.parse({...req.body,userAgent: req.headers["user-agent"]});

    const {
        accessToken, refreshToken
    } = await loginUser(request);

    return setAuthCookies({res, accessToken, refreshToken}).status(OK).json({
        message: "Login Successful",
    });
});

export const logoutHandler = catchErrors(async(req: Request, res: Response) => {

    const accessToken = req.cookies.accessToken as string|undefined;
    const {payload} = verifyToken(accessToken || ""); //we do not care about any err here

    if(payload){
        await SessionModel.findByIdAndDelete(payload.sessionId);
    }

    return clearAuthCookies(res).status(OK).json({
        message: "Logout Successful"
    });

})


export const refreshHandler = catchErrors(async(req: Request, res: Response) =>{
    const refreshToken = req.cookies.refreshToken as string|undefined;
    appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

    const{
        accessToken,
        newRefreshToken
    } = await refreshUserAccessToken(refreshToken);

    if(refreshToken){
        res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions())
    }
    return res.status(OK).cookie("accessToken", accessToken, getAccessTokenCookieOptions()).json({
        message: "Access Token Refreshed"
    });
});


