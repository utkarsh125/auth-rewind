"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = exports.setAuthCookies = exports.refreshTokenCookieOptions = exports.getRefreshTokenCookieOptions = exports.getAccessTokenCookieOptions = exports.REFRESH_PATH = void 0;
const Date_1 = require("./Date");
const secure = process.env.NODE_ENV !== "development";
exports.REFRESH_PATH = "/auth/refresh";
const defaults = {
    sameSite: "strict",
    httpOnly: true,
    secure: true,
};
const getAccessTokenCookieOptions = () => ({
    ...defaults,
    expires: (0, Date_1.fifteenMinutesFromNow)(),
});
exports.getAccessTokenCookieOptions = getAccessTokenCookieOptions;
const getRefreshTokenCookieOptions = () => ({
    ...defaults,
    expires: (0, Date_1.thirtyDaysFromNow)(),
    path: exports.REFRESH_PATH,
});
exports.getRefreshTokenCookieOptions = getRefreshTokenCookieOptions;
const refreshTokenCookieOptions = () => ({
    ...defaults,
    expires: (0, Date_1.thirtyDaysFromNow)(),
    path: exports.REFRESH_PATH,
});
exports.refreshTokenCookieOptions = refreshTokenCookieOptions;
// export const setAuthCookies = ({res, accessToken, refreshToken} : Params) =>{
//     res.cookie("accessToken", accessToken).cookie("refreshToken", refreshToken);
// }
const setAuthCookies = ({ res, accessToken, refreshToken }) => {
    res.cookie("accessToken", accessToken, (0, exports.getAccessTokenCookieOptions)())
        .cookie("refreshToken", refreshToken, (0, exports.refreshTokenCookieOptions)());
    return res; // Return the response object to allow chaining
};
exports.setAuthCookies = setAuthCookies;
const clearAuthCookies = (res) => {
    return res.clearCookie("accessToken").clearCookie("refreshToken", {
        path: exports.REFRESH_PATH,
    });
};
exports.clearAuthCookies = clearAuthCookies;
