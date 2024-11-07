"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSessionHandler = exports.getSessionHandler = void 0;
const http_1 = require("../constants/http");
const session_model_1 = __importDefault(require("../models/session.model"));
const appAssert_1 = __importDefault(require("../utils/appAssert"));
const catchErrors_1 = __importDefault(require("../utils/catchErrors"));
const zod_1 = require("zod");
exports.getSessionHandler = (0, catchErrors_1.default)(async (req, res) => {
    const sessions = await session_model_1.default.find({
        userId: req.userId,
        expiresAt: { $gt: new Date() },
    }, {
        _id: 1,
        userAgent: 1,
        createdAt: 1,
    }, {
        sort: { createdAt: -1 },
    });
    const formattedSessions = sessions.map((session) => ({
        ...session.toObject(),
        isCurrent: session.id === req.sessionId,
    }));
    return res.status(200).json(formattedSessions);
});
exports.deleteSessionHandler = (0, catchErrors_1.default)(async (req, res) => {
    const sessionId = zod_1.z.string().parse(req.params.id);
    const deleted = await session_model_1.default.findOneAndDelete({
        _id: sessionId,
        userId: req.userId,
    });
    (0, appAssert_1.default)(deleted, http_1.NOT_FOUND, "Session not found");
    return res.status(http_1.OK).json({
        message: "Session deleted"
    });
});
