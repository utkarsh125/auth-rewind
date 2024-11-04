import { CREATED, OK } from "../constants/http";
import { Request, Response } from "express";
import { createAccount, loginUser } from "../services/auth.service";
import { loginSchema, registerSchema } from "./auth.schemas";

import catchErrors from "../utils/catchErrors";
import { setAuthCookies } from "../utils/cookies";
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

