"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = exports.refreshTokenSignOptions = void 0;
const env_1 = require("../constants/env");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const defaults = {
    audience: ["user"],
};
const AccessTokenSignOptions = {
    expiresIn: "15m",
    secret: env_1.JWT_SECRET,
};
exports.refreshTokenSignOptions = {
    expiresIn: "30d",
    secret: env_1.JWT_REFRESH_SECRET,
};
const signToken = (payload, options) => {
    const { secret, ...signOpts } = options || AccessTokenSignOptions;
    return jsonwebtoken_1.default.sign(payload, secret, {
        ...defaults,
        ...signOpts,
    });
};
exports.signToken = signToken;
const verifyToken = (token, options) => {
    const { secret = env_1.JWT_SECRET, ...verifyOpts } = options || {};
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret, {
            ...defaults,
            ...verifyOpts
        });
        return {
            payload
        };
    }
    catch (err) {
        return {
            error: err.message,
        };
    }
};
exports.verifyToken = verifyToken;
