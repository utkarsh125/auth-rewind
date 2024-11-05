import { CookieOptions, Response } from "express"
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./Date";

const secure = process.env.NODE_ENV !== "development";
export const REFRESH_PATH = "/auth/refresh";

const defaults: CookieOptions = {
    sameSite: "strict",
    httpOnly: true,
    secure: true,
}

export const getAccessTokenCookieOptions = () : CookieOptions => ({
    ...defaults,
    expires: fifteenMinutesFromNow(),
})

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: thirtyDaysFromNow(),
    path: REFRESH_PATH,
  });


export const refreshTokenCookieOptions = () : CookieOptions => ({
    ...defaults,
    expires: thirtyDaysFromNow(),
    path: REFRESH_PATH,
})

type Params = {
    res: Response;
    accessToken: string,
    refreshToken: string,
}

// export const setAuthCookies = ({res, accessToken, refreshToken} : Params) =>{
//     res.cookie("accessToken", accessToken).cookie("refreshToken", refreshToken);
// }
export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) => {
    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions())
       .cookie("refreshToken", refreshToken, refreshTokenCookieOptions());
    
    return res; // Return the response object to allow chaining
};

export const clearAuthCookies = (res: Response) =>{
    return res.clearCookie("accessToken").clearCookie("refreshToken", {
        path: REFRESH_PATH,
    })
}
