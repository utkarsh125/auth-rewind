import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import jwt, { SignCallback, SignOptions, VerifyOptions } from "jsonwebtoken";

import { SessionDocument } from "../models/session.model";
import { UserDocument } from "../models/user.model";

export type RefreshTokenPayload = {
    sessionId: SessionDocument["_id"];
};

export type AccessTokenPayload = {
    userId: UserDocument["_id"];
    sessionId: SessionDocument["_id"];
};

type SignOptionsAndSecret = SignOptions & {
    secret: string;
};

const defaults: SignOptions = {
    audience: ["user"],
};

const AccessTokenSignOptions: SignOptionsAndSecret = {
    expiresIn: "15m",
    secret: JWT_SECRET,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
    expiresIn: "30d",
    secret: JWT_REFRESH_SECRET,
}

export const signToken = (
    payload: AccessTokenPayload | RefreshTokenPayload,
    options?: SignOptionsAndSecret
) => {
    const {secret, ...signOpts} = options || AccessTokenSignOptions;
    return jwt.sign(payload, secret, {
        ...defaults,
        ...signOpts,
    });
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
    token: string,
    options?: VerifyOptions & { secret: string }
) => {
    const { secret = JWT_SECRET, ...verifyOpts } = options || {}
    try{
        const payload = jwt.verify(
            token, secret, {
                ...defaults,
                ...verifyOpts  
            }
        ) as TPayload
        return {
            payload
        }
    }catch(err: any){
        return {
            error: err.message,
        }
    }
}